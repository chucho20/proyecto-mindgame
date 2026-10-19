import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaProgresoMision(progreso) {
	if (!progreso) {
		return null;
	}

	return {
		id: progreso.id,
		usuario_id: progreso.usuarioId,
		mision_id: progreso.misionId,
		estado: progreso.estado,
		iniciada_en: progreso.iniciadaEn,
		completada_en: progreso.completadaEn,
		created_at: progreso.createdAt,
		updated_at: progreso.updatedAt,
	};
}

export async function findByUsuarioYMision(usuarioId, misionId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const misionIdNormalizado = normalizarId(misionId);
	if (usuarioIdNormalizado === null || misionIdNormalizado === null) {
		return null;
	}

	const progreso = await prisma.progresoMision.findUnique({
		where: { usuarioId_misionId: { usuarioId: usuarioIdNormalizado, misionId: misionIdNormalizado } },
	});
	return aFilaProgresoMision(progreso);
}

export async function findAllByUsuario(usuarioId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	if (usuarioIdNormalizado === null) {
		return [];
	}

	const progresos = await prisma.progresoMision.findMany({ where: { usuarioId: usuarioIdNormalizado } });
	return progresos.map(aFilaProgresoMision);
}

/**
 * Crea el registro de progreso de una misión para un usuario. Puede lanzar
 * un error de violación UNIQUE (`P2002` en Prisma; ver `esViolacionUnica` en
 * utils/dbErrors.js) si ya existe (UNIQUE usuario_id + mision_id) — el caller
 * decide cómo manejar la carrera (ver mision.service).
 */
export async function create(usuarioId, misionId, estado = "en_progreso") {
	const progreso = await prisma.progresoMision.create({
		data: {
			usuarioId: Number(usuarioId),
			misionId: Number(misionId),
			estado,
			iniciadaEn: new Date(),
		},
	});
	return aFilaProgresoMision(progreso);
}

export async function updateEstado(usuarioId, misionId, estado) {
	const data = { estado };

	if (estado === "completada") {
		data.completadaEn = new Date();
	}

	await prisma.progresoMision.updateMany({
		where: { usuarioId: Number(usuarioId), misionId: Number(misionId) },
		data,
	});
	return findByUsuarioYMision(usuarioId, misionId);
}
