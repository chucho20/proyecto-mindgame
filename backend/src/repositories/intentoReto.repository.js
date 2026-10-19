import prisma from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.ts";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
// `respuesta_dada` es JSON nativo: pasa tal cual, sin conversión.
function aFilaIntentoReto(intento) {
	if (!intento) {
		return null;
	}

	return {
		id: intento.id,
		usuario_id: intento.usuarioId,
		reto_id: intento.retoId,
		respuesta_dada: intento.respuestaDada,
		// mysql2 devolvía los BOOLEAN (TINYINT(1)) como 0/1.
		es_correcto: Number(intento.esCorrecto),
		puntos_obtenidos: intento.puntosObtenidos,
		resuelto_en: intento.resueltoEn,
	};
}

export async function create({ usuarioId, retoId, respuestaDada, esCorrecto, puntosObtenidos }) {
	const intento = await prisma.intentoReto.create({
		data: {
			usuarioId: Number(usuarioId),
			retoId: Number(retoId),
			// En una columna JSON, un `null` de JS hay que traducirlo a JSON `null`.
			respuestaDada: respuestaDada === null ? Prisma.JsonNull : respuestaDada,
			esCorrecto: Boolean(esCorrecto),
			puntosObtenidos,
		},
	});
	return aFilaIntentoReto(intento);
}

export async function findByUsuarioYReto(usuarioId, retoId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const retoIdNormalizado = normalizarId(retoId);
	if (usuarioIdNormalizado === null || retoIdNormalizado === null) {
		return [];
	}

	const intentos = await prisma.intentoReto.findMany({
		where: { usuarioId: usuarioIdNormalizado, retoId: retoIdNormalizado },
		orderBy: { resueltoEn: "desc" },
	});
	return intentos.map(aFilaIntentoReto);
}

/**
 * Cuenta cuántos retos distintos de una misión el usuario ya respondió
 * correctamente al menos una vez (usado para calcular si la misión está
 * completa). Equivale al `COUNT(DISTINCT reto_id)` del JOIN original: se
 * cuentan los retos de la misión que tengan algún intento correcto del usuario.
 */
export async function countRetosCorrectosPorMision(usuarioId, misionId) {
	const usuarioIdNormalizado = normalizarId(usuarioId);
	const misionIdNormalizado = normalizarId(misionId);
	if (usuarioIdNormalizado === null || misionIdNormalizado === null) {
		return 0;
	}

	return prisma.reto.count({
		where: {
			misionId: misionIdNormalizado,
			intentosRetos: { some: { usuarioId: usuarioIdNormalizado, esCorrecto: true } },
		},
	});
}
