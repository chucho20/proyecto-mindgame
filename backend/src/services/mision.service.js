import AppError from "../utils/AppError.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as historiaRepository from "../repositories/historia.repository.js";
import * as progresoMisionRepository from "../repositories/progresoMision.repository.js";
import * as retoRepository from "../repositories/reto.repository.js";
import * as actividadRepository from "../repositories/actividad.repository.js";
import * as intentoRetoRepository from "../repositories/intentoReto.repository.js";
import * as actividadCompletadaRepository from "../repositories/actividadCompletada.repository.js";

function construirMisionConProgreso(mision, progreso) {
	return {
		...mision,
		progreso: progreso ? progreso.estado : "disponible",
		iniciada_en: progreso ? progreso.iniciada_en : null,
		completada_en: progreso ? progreso.completada_en : null,
	};
}

export async function listar(usuarioId) {
	const misiones = await misionRepository.findAllActivas();
	const progresos = await progresoMisionRepository.findAllByUsuario(usuarioId);
	const progresoPorMision = new Map(progresos.map((progreso) => [progreso.mision_id, progreso]));

	return misiones.map((mision) => construirMisionConProgreso(mision, progresoPorMision.get(mision.id)));
}

export async function obtener(id, usuarioId) {
	const mision = await misionRepository.findById(id);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const progreso = await progresoMisionRepository.findByUsuarioYMision(usuarioId, id);
	return construirMisionConProgreso(mision, progreso);
}

export async function iniciar(id, usuarioId) {
	const mision = await misionRepository.findById(id);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const existente = await progresoMisionRepository.findByUsuarioYMision(usuarioId, id);
	if (existente) {
		return existente;
	}

	try {
		return await progresoMisionRepository.create(usuarioId, id, "en_progreso");
	} catch (error) {
		// Carrera entre dos requests iniciando la misma misión al mismo tiempo:
		// el UNIQUE (usuario_id, mision_id) rechaza al segundo insert. Devolvemos
		// el registro existente en vez de un 500 (mismo patrón que el registro
		// de usuarios en Sprint 1 con el UNIQUE de correo).
		if (error && error.code === "ER_DUP_ENTRY") {
			return progresoMisionRepository.findByUsuarioYMision(usuarioId, id);
		}
		throw error;
	}
}

/**
 * Recalcula si la misión quedó completa para el usuario (todos los retos
 * activos respondidos correctamente al menos una vez + todas las actividades
 * activas completadas) y, si corresponde, marca progreso_misiones como
 * 'completada'. Se llama después de responder un reto correctamente o de
 * completar una actividad.
 *
 * Nota de diseño: esto NO es el sistema de puntos/niveles de Sprint 3
 * (ServicioDeProgreso) — es solo el estado mínimo de avance por misión que
 * pide RF-007/008 ("diferenciar actividades disponibles y completadas").
 */
export async function actualizarProgresoSiCompleta(misionId, usuarioId) {
	let progreso = await progresoMisionRepository.findByUsuarioYMision(usuarioId, misionId);

	// Si el cliente respondió un reto o completó una actividad sin pasar antes
	// por POST /misiones/:id/iniciar (el frontend siempre lo hace, pero no hay
	// que asumirlo), no existe fila de progreso todavía — la creamos acá para
	// no perder el avance silenciosamente.
	if (!progreso) {
		try {
			progreso = await progresoMisionRepository.create(usuarioId, misionId, "en_progreso");
		} catch (error) {
			// Misma carrera que en iniciar(): otra request pudo haber creado la
			// fila justo antes que esta.
			if (error && error.code === "ER_DUP_ENTRY") {
				progreso = await progresoMisionRepository.findByUsuarioYMision(usuarioId, misionId);
			} else {
				throw error;
			}
		}
	}

	if (progreso.estado === "completada") {
		return progreso;
	}

	const [totalRetos, retosCorrectos, totalActividades, actividadesCompletadas] = await Promise.all([
		retoRepository.countByMisionId(misionId, { onlyActive: true }),
		intentoRetoRepository.countRetosCorrectosPorMision(usuarioId, misionId),
		actividadRepository.countByMisionId(misionId, { onlyActive: true }),
		actividadCompletadaRepository.countCompletadasPorMision(usuarioId, misionId),
	]);

	const hayContenidoEvaluable = totalRetos > 0 || totalActividades > 0;
	const estaCompleta =
		hayContenidoEvaluable && retosCorrectos >= totalRetos && actividadesCompletadas >= totalActividades;

	if (estaCompleta) {
		return progresoMisionRepository.updateEstado(usuarioId, misionId, "completada");
	}

	return progreso;
}

// --- Admin CRUD (RF-024/025) ---

export async function listarAdmin() {
	return misionRepository.findAllAdmin();
}

export async function obtenerAdmin(id) {
	const mision = await misionRepository.findById(id);

	if (!mision) {
		throw new AppError("Misión no encontrada.", 404);
	}

	return mision;
}

function validarMision(data, { esCreacion }) {
	const errors = [];

	if (esCreacion || data.titulo !== undefined) {
		if (typeof data.titulo !== "string" || data.titulo.trim().length === 0) {
			errors.push("El título es obligatorio.");
		}
	}

	if (data.orden !== undefined && data.orden !== null && !Number.isFinite(Number(data.orden))) {
		errors.push("El orden debe ser un número.");
	}

	return errors;
}

export async function crear(data) {
	const errors = validarMision(data, { esCreacion: true });

	if (errors.length > 0) {
		throw new AppError("Datos de misión inválidos.", 400, errors);
	}

	return misionRepository.create({
		titulo: data.titulo.trim(),
		descripcion: data.descripcion || null,
		orden: data.orden !== undefined ? Number(data.orden) : 0,
		estado: "activa",
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarMision(data, { esCreacion: false });
	if (errors.length > 0) {
		throw new AppError("Datos de misión inválidos.", 400, errors);
	}

	return misionRepository.update(id, {
		titulo: data.titulo !== undefined ? data.titulo.trim() : undefined,
		descripcion: data.descripcion,
		orden: data.orden !== undefined ? Number(data.orden) : undefined,
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError("Estado inválido. Debe ser 'activa' o 'inactiva'.", 400);
	}

	await obtenerAdmin(id);
	return misionRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await misionRepository.remove(id);
}

/**
 * Conteos reales para la landing del dashboard admin (GET /admin/stats).
 * A propósito no inventa métricas que todavía no existen (usuarios,
 * convivencia) — solo lo que este sprint efectivamente modela.
 */
export async function obtenerStatsAdmin() {
	const [misiones, historias, retos, actividades] = await Promise.all([
		misionRepository.countAll(),
		historiaRepository.countAll(),
		retoRepository.countAll(),
		actividadRepository.countAll(),
	]);

	return { misiones, historias, retos, actividades };
}
