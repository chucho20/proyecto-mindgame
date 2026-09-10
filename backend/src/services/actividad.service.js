import AppError from "../utils/AppError.js";
import * as actividadRepository from "../repositories/actividad.repository.js";
import * as actividadCompletadaRepository from "../repositories/actividadCompletada.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as misionService from "./mision.service.js";

export async function listar(misionId, usuarioId) {
	const mision = await misionRepository.findById(misionId);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const actividades = await actividadRepository.findByMisionId(misionId, { onlyActive: true });
	const completadas = await actividadCompletadaRepository.findAllByUsuario(usuarioId);
	const completadasIds = new Set(completadas.map((completada) => completada.actividad_id));

	return actividades.map((actividad) => ({
		...actividad,
		completada: completadasIds.has(actividad.id),
	}));
}

export async function completar(actividadId, usuarioId) {
	const actividad = await actividadRepository.findById(actividadId);

	if (!actividad || actividad.estado !== "activa") {
		throw new AppError("Actividad no encontrada.", 404);
	}

	try {
		await actividadCompletadaRepository.create(usuarioId, actividadId);
	} catch (error) {
		// Completar dos veces la misma actividad no es un error de negocio: es
		// idempotente. El UNIQUE (usuario_id, actividad_id) evita duplicados en
		// carrera y acá simplemente lo ignoramos en vez de romper el flujo.
		if (!(error && error.code === "ER_DUP_ENTRY")) {
			throw error;
		}
	}

	if (actividad.mision_id) {
		await misionService.actualizarProgresoSiCompleta(actividad.mision_id, usuarioId);
	}

	return { completada: true };
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
