import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";
import { aFilaRecompensa } from "./recompensa.repository.js";

// Fila de `recompensas_obtenidas` (snake_case). Cuando se consulta con el
// detalle, `recompensa` trae la fila completa de la recompensa.
function aFilaRecompensaObtenida(obtenida) {
	if (!obtenida) {
		return null;
	}

	return {
		id: obtenida.id,
		usuario_id: obtenida.usuarioId,
		recompensa_id: obtenida.recompensaId,
		obtenida_en: obtenida.obtenidaEn,
		...(obtenida.recompensa ? { recompensa: aFilaRecompensa(obtenida.recompensa) } : {}),
	};
}

/**
 * Registra una recompensa como obtenida. Puede lanzar un error de violación
 * UNIQUE (`P2002` en Prisma; ver `esViolacionUnica` en utils/dbErrors.js) si el
 * usuario ya la tenía (UNIQUE usuario_id + recompensa_id) — el servicio lo trata
 * como éxito idempotente.
 */
export async function create(usuarioId, recompensaId) {
	const obtenida = await prisma.recompensaObtenida.create({
		data: { usuarioId: Number(usuarioId), recompensaId: Number(recompensaId) },
	});
	return aFilaRecompensaObtenida(obtenida);
}

export async function findByUsuarioYRecompensa(usuarioId, recompensaId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const recompensaIdNormalizado = normalizarId(recompensaId);
	if (usuarioIdNormalizado === null || recompensaIdNormalizado === null) {
		return null;
	}

	const obtenida = await prisma.recompensaObtenida.findUnique({
		where: {
			usuarioId_recompensaId: { usuarioId: usuarioIdNormalizado, recompensaId: recompensaIdNormalizado },
		},
	});
	return aFilaRecompensaObtenida(obtenida);
}

/**
 * Recompensas que el usuario ya obtuvo, con el detalle de cada recompensa
 * (incluso si después fue desactivada), de la más antigua a la más reciente.
 */
export async function findAllByUsuario(usuarioId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	if (usuarioIdNormalizado === null) {
		return [];
	}

	const obtenidas = await prisma.recompensaObtenida.findMany({
		where: { usuarioId: usuarioIdNormalizado },
		include: { recompensa: true },
		orderBy: [{ obtenidaEn: "asc" }, { id: "asc" }],
	});
	return obtenidas.map(aFilaRecompensaObtenida);
}
