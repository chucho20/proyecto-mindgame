import AppError from "../utils/AppError.js";
import * as historiaRepository from "../repositories/historia.repository.js";
import * as historiaCompletadaRepository from "../repositories/historiaCompletada.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as progresoMisionRepository from "../repositories/progresoMision.repository.js";

export async function listarPorMision(misionId, usuarioId) {
	const mision = await misionRepository.findById(misionId);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const historias = await historiaRepository.findByMisionId(misionId, { onlyActive: true });
	const completadas = await historiaCompletadaRepository.findAllByUsuario(usuarioId);
	const completadasIds = new Set(completadas.map((completada) => completada.historia_id));

	return historias.map((historia) => ({
		...historia,
		completada: completadasIds.has(historia.id),
	}));
}

/**
 * Marca el paso de "leer la historia" como hecho (RF-009: "el sistema deberá
 * indicar cuándo el contenido ha sido completado"). Registra la lectura en
 * `historias_completadas` (idempotente, igual que actividad.service.js) y de
 * paso asegura que exista `progreso_misiones` para esa misión.
 */
export async function marcarCompletada(historiaId, usuarioId) {
	const historia = await historiaRepository.findById(historiaId);

	if (!historia || historia.estado !== "activa") {
		throw new AppError("Historia no encontrada.", 404);
	}

	try {
		await historiaCompletadaRepository.create(usuarioId, historiaId);
	} catch (error) {
		if (!(error && error.code === "ER_DUP_ENTRY")) {
			throw error;
		}
	}

	const existente = await progresoMisionRepository.findByUsuarioYMision(usuarioId, historia.mision_id);

	if (existente) {
		return { completada: true, progreso: existente };
	}

	try {
		const progreso = await progresoMisionRepository.create(usuarioId, historia.mision_id, "en_progreso");
		return { completada: true, progreso };
	} catch (error) {
		if (error && error.code === "ER_DUP_ENTRY") {
			const progreso = await progresoMisionRepository.findByUsuarioYMision(usuarioId, historia.mision_id);
			return { completada: true, progreso };
		}
		throw error;
	}
}

// --- Admin CRUD ---

export async function listarAdmin({ misionId } = {}) {
	return historiaRepository.findAllAdmin({ misionId });
}

export async function obtenerAdmin(id) {
	const historia = await historiaRepository.findById(id);

	if (!historia) {
		throw new AppError("Historia no encontrada.", 404);
	}

	return historia;
}

function validarHistoria(data, { esCreacion }) {
	const errors = [];

	if (esCreacion && !data.misionId) {
		errors.push("La misión es obligatoria.");
	}

	if (esCreacion || data.titulo !== undefined) {
		if (typeof data.titulo !== "string" || data.titulo.trim().length === 0) {
			errors.push("El título es obligatorio.");
		}
	}

	if (esCreacion || data.contenido !== undefined) {
		if (typeof data.contenido !== "string" || data.contenido.trim().length === 0) {
			errors.push("El contenido es obligatorio.");
		}
	}

	return errors;
}

export async function crear(data) {
	const errors = validarHistoria(data, { esCreacion: true });

	if (errors.length > 0) {
		throw new AppError("Datos de historia inválidos.", 400, errors);
	}

	const mision = await misionRepository.findById(data.misionId);
	if (!mision) {
		throw new AppError("La misión indicada no existe.", 400);
	}

	return historiaRepository.create({
		misionId: data.misionId,
		titulo: data.titulo.trim(),
		contenido: data.contenido.trim(),
		orden: data.orden !== undefined ? Number(data.orden) : 0,
		estado: "activa",
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarHistoria(data, { esCreacion: false });
	if (errors.length > 0) {
		throw new AppError("Datos de historia inválidos.", 400, errors);
	}

	return historiaRepository.update(id, {
		titulo: data.titulo !== undefined ? data.titulo.trim() : undefined,
		contenido: data.contenido !== undefined ? data.contenido.trim() : undefined,
		orden: data.orden !== undefined ? Number(data.orden) : undefined,
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError("Estado inválido. Debe ser 'activa' o 'inactiva'.", 400);
	}

	await obtenerAdmin(id);
	return historiaRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await historiaRepository.remove(id);
}
