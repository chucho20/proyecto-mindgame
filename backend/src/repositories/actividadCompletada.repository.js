import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaActividadCompletada(completada) {
	if (!completada) {
		return null;
	}

	return {
		id: completada.id,
		usuario_id: completada.usuarioId,
		actividad_id: completada.actividadId,
		completada_en: completada.completadaEn,
	};
}

export async function findByUsuarioYActividad(usuarioId, actividadId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const actividadIdNormalizado = normalizarId(actividadId);
	if (usuarioIdNormalizado === null || actividadIdNormalizado === null) {
		return null;
	}

	const completada = await prisma.actividadCompletada.findUnique({
		where: {
			usuarioId_actividadId: { usuarioId: usuarioIdNormalizado, actividadId: actividadIdNormalizado },
		},
	});
	return aFilaActividadCompletada(completada);
}

/**
 * Marca una actividad como completada. Puede lanzar un error de violación
 * UNIQUE (`P2002` en Prisma; ver `esViolacionUnica` en utils/dbErrors.js) si
 * ya estaba completada (UNIQUE usuario_id + actividad_id) — el caller lo trata
 * como éxito idempotente.
 */
export async function create(usuarioId, actividadId) {
	const completada = await prisma.actividadCompletada.create({
		data: { usuarioId: Number(usuarioId), actividadId: Number(actividadId) },
	});
	return aFilaActividadCompletada(completada);
}

/**
 * Marca la actividad como completada y suma sus puntos a `usuarios.puntos_totales`
 * en la MISMA transacción: la fila y los puntos se confirman juntos o no se
 * confirma nada, así un fallo intermedio no deja la actividad "ya completada" sin
 * sus puntos. Si ya estaba completada, el UNIQUE (usuario_id + actividad_id)
 * lanza `P2002`, la transacción se revierte entera (sin sumar nada) y el error
 * sube al caller, que lo trata como éxito idempotente.
 *
 * El UPDATE de puntos va PRIMERO a propósito: toma el lock de la fila del usuario
 * y serializa las transacciones simultáneas del mismo usuario. Si el INSERT fuera
 * primero, varias requests duplicadas esperarían a la vez por la misma clave
 * UNIQUE y InnoDB resolvería la carrera abortando a algunas por deadlock (500)
 * en vez de dejarlas fallar limpiamente con `P2002`.
 */
export async function createConPuntos(usuarioId, actividadId, puntos) {
	const usuarioIdNumero = Number(usuarioId);

	const completada = await prisma.$transaction(async (tx) => {
		// Con 0 puntos el increment no cambia nada, pero igual toma el lock de la fila.
		await tx.usuario.updateMany({
			where: { id: usuarioIdNumero },
			data: { puntosTotales: { increment: puntos > 0 ? Number(puntos) : 0 } },
		});

		return tx.actividadCompletada.create({
			data: { usuarioId: usuarioIdNumero, actividadId: Number(actividadId) },
		});
	});

	return aFilaActividadCompletada(completada);
}

export async function findAllByUsuario(usuarioId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	if (usuarioIdNormalizado === null) {
		return [];
	}

	const completadas = await prisma.actividadCompletada.findMany({
		where: { usuarioId: usuarioIdNormalizado },
	});
	return completadas.map(aFilaActividadCompletada);
}

/**
 * Cuenta cuántas actividades de una misión el usuario ya completó (usado
 * para calcular si la misión está completa).
 */
export async function countCompletadasPorMision(usuarioId, misionId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const misionIdNormalizado = normalizarId(misionId);
	if (usuarioIdNormalizado === null || misionIdNormalizado === null) {
		return 0;
	}

	return prisma.actividadCompletada.count({
		where: { usuarioId: usuarioIdNormalizado, actividad: { misionId: misionIdNormalizado } },
	});
}
