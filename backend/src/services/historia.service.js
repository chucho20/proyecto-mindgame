
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

	const historias =
		await historiaRepository.findByMisionId(misionId, {
			onlyActive: true,
		});

	const completadas =
		await historiaCompletadaRepository.findAllByUsuario(
			usuarioId,
		);

	const completadasIds = new Set(
		completadas.map(
			(completada) => completada.historiaId,
		),
	);

	return historias.map((historia) => ({
		...historia,
		completada: completadasIds.has(historia.id),
	}));
}

/**
 * Marca el paso de "leer la historia" como hecho (RF-009).
 * Registra la lectura en historias_completadas y asegura
 * que exista progreso_misiones para esa misión.
 */
export async function marcarCompletada(
	historiaId,
	usuarioId,
) {
	const historia =
		await historiaRepository.findById(historiaId);

	if (!historia || historia.estado !== "activa") {
		throw new AppError(
			"Historia no encontrada.",
			404,
		);
	}

	try {
		await historiaCompletadaRepository.create(
			usuarioId,
			historiaId,
		);
	} catch (error) {
		// Prisma usa P2002 cuando la lectura ya estaba registrada.
		if (error?.code !== "P2002") {
			throw error;
		}
	}

	const existente =
		await progresoMisionRepository.findByUsuarioYMision(
			usuarioId,
			historia.misionId,
		)
