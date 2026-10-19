import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaHistoriaCompletada(completada) {
	if (!completada) {
		return null;
	}

	return {
		id: completada.id,
		usuario_id: completada.usuarioId,
		historia_id: completada.historiaId,
		completada_en: completada.completadaEn,
	};
}

export async function findByUsuarioYHistoria(usuarioId, historiaId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const historiaIdNormalizado = normalizarId(historiaId);
	if (usuarioIdNormalizado === null || historiaIdNormalizado === null) {
		return null;
	}

	const completada = await prisma.historiaCompletada.findUnique({
		where: {
			usuarioId_historiaId: { usuarioId: usuarioIdNormalizado, historiaId: historiaIdNormalizado },
		},
	});
	return aFilaHistoriaCompletada(completada);
}

/**
 * Marca una historia como leída. Puede lanzar un error de violación UNIQUE
 * (`P2002` en Prisma; ver `esViolacionUnica` en utils/dbErrors.js) si ya
 * estaba marcada (UNIQUE usuario_id + historia_id) — el caller lo trata como
 * éxito idempotente.
 */
export async function create(usuarioId, historiaId) {
	const completada = await prisma.historiaCompletada.create({
		data: { usuarioId: Number(usuarioId), historiaId: Number(historiaId) },
	});
	return aFilaHistoriaCompletada(completada);
}

export async function findAllByUsuario(usuarioId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	if (usuarioIdNormalizado === null) {
		return [];
	}

	const completadas = await prisma.historiaCompletada.findMany({
		where: { usuarioId: usuarioIdNormalizado },
	});
	return completadas.map(aFilaHistoriaCompletada);
}
