import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";
import { aFilaLogro } from "./logro.repository.js";

// Fila de `logros_obtenidos` (snake_case). Cuando se consulta con el detalle,
// `logro` trae la fila completa del logro.
function aFilaLogroObtenido(obtenido) {
	if (!obtenido) {
		return null;
	}

	return {
		id: obtenido.id,
		usuario_id: obtenido.usuarioId,
		logro_id: obtenido.logroId,
		obtenido_en: obtenido.obtenidoEn,
		...(obtenido.logro ? { logro: aFilaLogro(obtenido.logro) } : {}),
	};
}

/**
 * Registra un logro como obtenido. Puede lanzar un error de violación UNIQUE
 * (`P2002` en Prisma; ver `esViolacionUnica` en utils/dbErrors.js) si el
 * usuario ya lo tenía (UNIQUE usuario_id + logro_id) — el servicio lo trata
 * como éxito idempotente.
 */
export async function create(usuarioId, logroId) {
	const obtenido = await prisma.logroObtenido.create({
		data: { usuarioId: Number(usuarioId), logroId: Number(logroId) },
	});
	return aFilaLogroObtenido(obtenido);
}

export async function findByUsuarioYLogro(usuarioId, logroId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const logroIdNormalizado = normalizarId(logroId);
	if (usuarioIdNormalizado === null || logroIdNormalizado === null) {
		return null;
	}

	const obtenido = await prisma.logroObtenido.findUnique({
		where: { usuarioId_logroId: { usuarioId: usuarioIdNormalizado, logroId: logroIdNormalizado } },
	});
	return aFilaLogroObtenido(obtenido);
}

/**
 * Logros que el usuario ya obtuvo, con el detalle de cada logro (incluso si
 * después fue desactivado), del más antiguo al más reciente.
 */
export async function findAllByUsuario(usuarioId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	if (usuarioIdNormalizado === null) {
		return [];
	}

	const obtenidos = await prisma.logroObtenido.findMany({
		where: { usuarioId: usuarioIdNormalizado },
		include: { logro: true },
		orderBy: [{ obtenidoEn: "asc" }, { id: "asc" }],
	});
	return obtenidos.map(aFilaLogroObtenido);
}
