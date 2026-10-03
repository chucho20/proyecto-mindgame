
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
		iniciadaEn: progreso ? progreso.iniciadaEn : null,
		completadaEn: progreso ? progreso.completadaEn : null,
	};
}

export async function listar(usuarioId) {
	const misiones = await misionRepository.findAllActivas();
	const progresos =
		await progresoMisionRepository.findAllByUsuario(usuarioId);

	const progresoPorMision = new Map(
		progresos.map((progreso) => [
			progreso.misionId,
			progreso,
		]),
	);

	return misiones.map((mision) =>
		construirMisionConProgreso(
			mision,
			progresoPorMision.get(mision.id),
		),
	);
}

export async function obtener(id, usuarioId) {
	const mision = await misionRepository.findById(id);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const progreso =
		await progresoMisionRepository.findByUsuarioYMision(
			usuarioId,
			id,
		);

	return construirMisionConProgreso(mision, progreso);
}

export async function iniciar(id, usuarioId) {
	const mision = await misionRepository.findById(id);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const existente =
		await progresoMisionRepository.findByUsuarioYMision(
			usuarioId,
			id,
		);

	if (existente) {
		return existente;
	}

	try {
		return await progresoMisionRepository.create(
			usuarioId,
			id,
			"en_progreso",
		);
	} catch (error) {
		// Prisma usa P2002 cuando se viola una restricción UNIQUE.
		if (error?.code === "P2002") {
			return progresoMisionRepository.findByUsuarioYMision(
				usuarioId,
				id,
			);
		}

		throw error;
	}
}

/**
 * Recalcula si la misión quedó completa para el usuario:
 * todos los retos activos respondidos correctamente al menos
 * una vez + todas las actividades activas completadas.
 */
export async function actualizarProgresoSiCompleta(
	misionId,
	usuarioId,
) {
	let progreso =
		await progresoMisionRepository.findByUsuarioYMision(
			usuarioId,
			misionId,
		);

	// Si no existe progreso, se crea automáticamente.
	if (!progreso) {
		try {
			progreso =
				await progresoMisionRepository.create(
					usuarioId,
					misionId,
					"en_progreso",
				);
		} catch (error) {
			if (error?.code === "P2002") {
				progreso =
					await progresoMisionRepository.findByUsuarioYMision(
						usuarioId,
						misionId,
					);
			} else {
				throw error;
			}
		}
	}

	if (progreso.estado === "completada") {
		return progreso;
	}

	const [
		totalRetos,
		retosCorrectos,
		totalActividades,
		actividadesCompletadas,
	] = await Promise.all([
		retoRepository.countByMisionId(misionId, {
			onlyActive: true,
		}),

		intentoRetoRepository.countRetosCorrectosPorMision(
			usuarioId,
			misionId,
		),

		actividadRepository.countByMisionId(misionId, {
			onlyActive: true,
		}),

		actividadCompletadaRepository.countCompletadasPorMision(
			usuarioId,
			misionId,
		),
	]);

	const hayContenidoEvaluable =
		totalRetos > 0 || totalActividades > 0;

	const estaCompleta =
		hayContenidoEvaluable &&
		retosCorrectos >= totalRetos &&
		actividadesCompletadas >= totalActividades;

	if (estaCompleta) {
		return progresoMisionRepository.updateEstado(
			usuarioId,
			misionId,
			"completada",
		);
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
		if (
			typeof data.titulo !== "string" ||
			data.titulo.trim().length === 0
		) {
			errors.push("El título es obligatorio.");
		}
	}

	if (
		data.orden !== undefined &&
		data.orden !== null &&
		!Number.isFinite(Number(data.orden))
	) {
		errors.push("El orden debe ser un número.");
	}

	return errors;
}

export async function crear(data) {
	const errors = validarMision(data, {
		esCreacion: true,
	});

	if (errors.length > 0) {
		throw new AppError(
			"Datos de misión inválidos.",
			400,
			errors,
		);
	}

	return misionRepository.create({
		titulo: data.titulo.trim(),
		descripcion: data.descripcion || null,
		orden:
			data.orden !== undefined
				? Number(data.orden)
				: 0,
		estado: "activa",
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarMision(data, {
		esCreacion: false,
	});

	if (errors.length > 0) {
		throw new AppError(
			"Datos de misión inválidos.",
			400,
			errors,
		);
	}

	return misionRepository.update(id, {
		titulo:
			data.titulo !== undefined
				? data.titulo.trim()
				: undefined,

		descripcion: data.descripcion,

		orden:
			data.orden !== undefined
				? Number(data.orden)
				: undefined,
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError(
			"Estado inválido. Debe ser 'activa' o 'inactiva'.",
			400,
		);
	}

	await obtenerAdmin(id);

	return misionRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await misionRepository.remove(id);
}

/**
 * Conteos reales para la landing del dashboard admin.
 */
export async function obtenerStatsAdmin() {
	const [
		misiones,
		historias,
		retos,
		actividades,
	] = await Promise.all([
		misionRepository.countAll(),
		historiaRepository.countAll(),
		retoRepository.countAll(),
		actividadRepository.countAll(),
	]);

	return {
		misiones,
		historias,
		retos,
		actividades,
	};
}

