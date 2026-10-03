import AppError from "../utils/AppError.js";
import * as actividadRepository from "../repositories/actividad.repository.js";
import * as actividadCompletadaRepository from "../repositories/actividadCompletada.repository.js";
import * as progresoService from "./progreso.service.js";

export async function listarPorMision(
	misionId,
	{ onlyActive = true } = {},
) {
	return actividadRepository.findByMisionId(misionId, {
		onlyActive,
	});
}

export async function listarAdmin({ misionId } = {}) {
	return actividadRepository.findAllAdmin({ misionId });
}

export async function obtenerPorId(id) {
	const actividad = await actividadRepository.findById(id);

	if (!actividad) {
		throw new AppError("Actividad no encontrada.", 404);
	}

	return actividad;
}

export async function crear(data) {
	if (!data.titulo || !data.titulo.trim()) {
		throw new AppError(
			"El título de la actividad es obligatorio.",
			400,
		);
	}

	if (!data.tipo || !data.tipo.trim()) {
		throw new AppError(
			"El tipo de actividad es obligatorio.",
			400,
		);
	}

	return actividadRepository.create({
		misionId:
			data.misionId !== undefined
				? Number(data.misionId)
				: null,
		titulo: data.titulo.trim(),
		descripcion: data.descripcion,
		retroalimentacion: data.retroalimentacion,
		tipo: data.tipo.trim(),
		orden:
			data.orden !== undefined ? Number(data.orden) : 0,
		estado: data.estado,
	});
}

export async function actualizar(id, data) {
	const actividad = await actividadRepository.findById(id);

	if (!actividad) {
		throw new AppError("Actividad no encontrada.", 404);
	}

	return actividadRepository.update(id, {
		misionId:
			data.misionId !== undefined
				? Number(data.misionId)
				: undefined,
		titulo:
			data.titulo !== undefined
				? data.titulo.trim()
				: undefined,
		descripcion: data.descripcion,
		retroalimentacion: data.retroalimentacion,
		tipo:
			data.tipo !== undefined
				? data.tipo.trim()
				: undefined,
		orden:
			data.orden !== undefined
				? Number(data.orden)
				: undefined,
	});
}

export async function cambiarEstado(id, estado) {
	const actividad = await actividadRepository.findById(id);

	if (!actividad) {
		throw new AppError("Actividad no encontrada.", 404);
	}

	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError(
			"El estado debe ser activa o inactiva.",
			400,
		);
	}

	return actividadRepository.setEstado(id, estado);
}

export async function completar(id, usuarioId) {
	const actividad = await actividadRepository.findById(id);

	if (!actividad) {
		throw new AppError("Actividad no encontrada.", 404);
	}

	if (actividad.estado !== "activa") {
		throw new AppError(
			"La actividad no está activa.",
			400,
		);
	}

	try {
		await actividadCompletadaRepository.create({
			usuarioId,
			actividadId: id,
		});
	} catch (error) {
		if (error?.code === "P2002") {
			throw new AppError(
				"La actividad ya fue completada.",
				409,
			);
		}

		throw error;
	}

	// Si la actividad tiene puntos configurados, se asignan
	// mediante ServicioDeProgreso.
	const puntosObtenidos =
		actividad.puntos !== undefined
			? Number(actividad.puntos)
			: 0;

	if (puntosObtenidos > 0) {
		await progresoService.asignarPuntos(
			usuarioId,
			puntosObtenidos,
			"actividad",
		);
	}

	return {
		completada: true,
		puntosObtenidos,
		retroalimentacion:
			actividad.retroalimentacion || null,
	};
}