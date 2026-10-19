import AppError from "../utils/AppError.js";
import { esViolacionUnica } from "../utils/dbErrors.js";
import {
	esEnteroValido,
	esTextoOpcionalValido,
	LONGITUD_MAXIMA_TEXTO,
	normalizarTextoOpcional,
} from "../utils/validators.js";
import * as actividadRepository from "../repositories/actividad.repository.js";
import * as actividadCompletadaRepository from "../repositories/actividadCompletada.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as misionService from "./mision.service.js";
import * as progresoService from "./progreso.service.js";
import * as mensajePositivoService from "./mensajePositivo.service.js";
import { CONTEXTO_ACTIVIDAD_COMPLETADA } from "../constants/convivencia.js";

// Lista blanca de campos que un estudiante puede ver de una actividad: el conjunto que
// devolvía el endpoint antes de agregar `retroalimentacion` y `puntos`. La explicación
// se entrega recién al completar la actividad; las funciones *Admin devuelven la fila completa.
const CAMPOS_ACTIVIDAD_ESTUDIANTE = [
	"id",
	"mision_id",
	"titulo",
	"descripcion",
	"tipo",
	"orden",
	"estado",
	"created_at",
	"updated_at",
];

function sanitizarActividad(actividad) {
	return Object.fromEntries(
		CAMPOS_ACTIVIDAD_ESTUDIANTE.filter((campo) => campo in actividad).map((campo) => [
			campo,
			actividad[campo],
		]),
	);
}

export async function listar(misionId, usuarioId) {
	const mision = await misionRepository.findById(misionId);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const actividades = await actividadRepository.findByMisionId(misionId, { onlyActive: true });
	const completadas = await actividadCompletadaRepository.findAllByUsuario(usuarioId);
	const completadasIds = new Set(completadas.map((completada) => completada.actividad_id));

	return actividades.map((actividad) => ({
		...sanitizarActividad(actividad),
		completada: completadasIds.has(actividad.id),
	}));
}

export async function completar(actividadId, usuarioId) {
	const actividad = await actividadRepository.findById(actividadId);

	if (!actividad || actividad.estado !== "activa") {
		throw new AppError("Actividad no encontrada.", 404);
	}

	// Solo la primera vez que se completa la actividad suma puntos (RF-014).
	const puntosDeLaActividad = actividad.puntos > 0 ? actividad.puntos : 0;
	const nivelAnterior = puntosDeLaActividad > 0 ? await progresoService.obtenerNivelActual(usuarioId) : null;
	let esPrimeraVez = true;

	try {
		// La fila de actividad completada y la suma de puntos se confirman en una
		// sola transacción (ver createConPuntos): no puede quedar una sin la otra.
		await actividadCompletadaRepository.createConPuntos(usuarioId, actividadId, puntosDeLaActividad);
	} catch (error) {
		// Completar dos veces la misma actividad no es un error de negocio: es
		// idempotente. El UNIQUE (usuario_id, actividad_id) evita duplicados en
		// carrera; la transacción se revierte sin sumar puntos y acá simplemente lo
		// ignoramos en vez de romper el flujo.
		if (!esViolacionUnica(error)) {
			throw error;
		}
		esPrimeraVez = false;
	}

	if (actividad.mision_id) {
		await misionService.actualizarProgresoSiCompleta(actividad.mision_id, usuarioId);
	}

	// El UNIQUE hace de candado: aunque dos requests lleguen a la vez, solo una
	// logra insertar la fila y por lo tanto solo una suma los puntos. Nivel,
	// recompensas y logros se evalúan aparte, de forma idempotente (GET /api/progreso
	// lo repite si este paso no llega a correr).
	const puntosObtenidos = esPrimeraVez ? puntosDeLaActividad : 0;
	const progreso =
		puntosObtenidos > 0
			? await progresoService.evaluarProgresionTrasPuntos(usuarioId, puntosObtenidos, nivelAnterior)
			: null;

	// Con la actividad ya completada se entrega su explicación (RF-018) y, si pertenece
	// a una misión de convivencia, un mensaje positivo (RF-013). Las actividades sin
	// misión no tienen categoría, así que no llevan mensaje.
	const mision = actividad.mision_id ? await misionRepository.findById(actividad.mision_id) : null;
	const mensajePositivo = await mensajePositivoService.obtenerTextoParaMision(
		mision,
		CONTEXTO_ACTIVIDAD_COMPLETADA,
	);

	return {
		completada: true,
		puntos_obtenidos: puntosObtenidos,
		progreso,
		retroalimentacion: actividad.retroalimentacion ?? null,
		positive_message: mensajePositivo,
	};
}

// --- Admin CRUD ---

export async function listarAdmin({ misionId } = {}) {
	return actividadRepository.findAllAdmin({ misionId });
}

export async function obtenerAdmin(id) {
	const actividad = await actividadRepository.findById(id);

	if (!actividad) {
		throw new AppError("Actividad no encontrada.", 404);
	}

	return actividad;
}

function validarActividad(data, { esCreacion }) {
	const errors = [];

	if (esCreacion || data.titulo !== undefined) {
		if (typeof data.titulo !== "string" || data.titulo.trim().length === 0) {
			errors.push("El título es obligatorio.");
		}
	}

	if (esCreacion || data.tipo !== undefined) {
		if (typeof data.tipo !== "string" || data.tipo.trim().length === 0) {
			errors.push("El tipo es obligatorio.");
		}
	}

	if (data.descripcion !== undefined && data.descripcion !== null && typeof data.descripcion !== "string") {
		errors.push("La descripción debe ser texto.");
	}

	if (data.orden !== undefined && data.orden !== null && !esEnteroValido(data.orden)) {
		errors.push("El orden debe ser un número entero.");
	}

	if (data.puntos !== undefined && data.puntos !== null && !esEnteroValido(data.puntos, { min: 0 })) {
		errors.push("Los puntos deben ser un número entero mayor o igual a 0.");
	}

	if (!esTextoOpcionalValido(data.retroalimentacion)) {
		errors.push(`La retroalimentación debe ser texto de hasta ${LONGITUD_MAXIMA_TEXTO} caracteres.`);
	}

	return errors;
}

export async function crear(data) {
	const errors = validarActividad(data, { esCreacion: true });

	if (errors.length > 0) {
		throw new AppError("Datos de actividad inválidos.", 400, errors);
	}

	if (data.misionId) {
		const mision = await misionRepository.findById(data.misionId);
		if (!mision) {
			throw new AppError("La misión indicada no existe.", 400);
		}
	}

	return actividadRepository.create({
		misionId: data.misionId || null,
		titulo: data.titulo.trim(),
		descripcion: data.descripcion || null,
		tipo: data.tipo.trim(),
		orden: data.orden !== undefined ? Number(data.orden) : 0,
		estado: "activa",
		puntos: data.puntos !== undefined && data.puntos !== null ? Number(data.puntos) : 0,
		retroalimentacion: normalizarTextoOpcional(data.retroalimentacion) ?? null,
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarActividad(data, { esCreacion: false });
	if (errors.length > 0) {
		throw new AppError("Datos de actividad inválidos.", 400, errors);
	}

	return actividadRepository.update(id, {
		titulo: data.titulo !== undefined ? data.titulo.trim() : undefined,
		descripcion: data.descripcion,
		tipo: data.tipo !== undefined ? data.tipo.trim() : undefined,
		orden: data.orden !== undefined ? Number(data.orden) : undefined,
		puntos: data.puntos !== undefined && data.puntos !== null ? Number(data.puntos) : undefined,
		retroalimentacion: normalizarTextoOpcional(data.retroalimentacion),
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError("Estado inválido. Debe ser 'activa' o 'inactiva'.", 400);
	}

	await obtenerAdmin(id);
	return actividadRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await actividadRepository.remove(id);
}
