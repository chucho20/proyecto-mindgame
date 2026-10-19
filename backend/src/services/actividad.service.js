import AppError from "../utils/AppError.js";
import { esViolacionUnica } from "../utils/dbErrors.js";
import { esEnteroValido } from "../utils/validators.js";
import * as actividadRepository from "../repositories/actividad.repository.js";
import * as actividadCompletadaRepository from "../repositories/actividadCompletada.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as misionService from "./mision.service.js";
import * as progresoService from "./progreso.service.js";

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
	let esPrimeraVez = true;

	try {
		await actividadCompletadaRepository.create(usuarioId, actividadId);
	} catch (error) {
		// Completar dos veces la misma actividad no es un error de negocio: es
		// idempotente. El UNIQUE (usuario_id, actividad_id) evita duplicados en
		// carrera y acá simplemente lo ignoramos en vez de romper el flujo.
		if (!esViolacionUnica(error)) {
			throw error;
		}
		esPrimeraVez = false;
	}

	if (actividad.mision_id) {
		await misionService.actualizarProgresoSiCompleta(actividad.mision_id, usuarioId);
	}

	// El UNIQUE hace de candado: aunque dos requests lleguen a la vez, solo una
	// logra insertar la fila y por lo tanto solo una suma los puntos.
	const puntosObtenidos = esPrimeraVez && actividad.puntos > 0 ? actividad.puntos : 0;
	const progreso =
		puntosObtenidos > 0 ? await progresoService.asignarPuntos(usuarioId, puntosObtenidos) : null;

	return { completada: true, puntos_obtenidos: puntosObtenidos, progreso };
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
