import { esViolacionUnica } from "../utils/dbErrors.js";
import { cumpleCondicion } from "../utils/condiciones.js";
import * as recompensaRepository from "../repositories/recompensa.repository.js";
import * as recompensaObtenidaRepository from "../repositories/recompensaObtenida.repository.js";

// Forma que ve el estudiante (snake_case). `obtenida_en` solo existe en las ya obtenidas.
function aRecompensaEstudiante(recompensa, obtenidaEn) {
	return {
		id: recompensa.id,
		nombre: recompensa.nombre,
		descripcion: recompensa.descripcion,
		icono: recompensa.icono,
		condicion_tipo: recompensa.condicion_tipo,
		condicion_valor: recompensa.condicion_valor,
		...(obtenidaEn ? { obtenida_en: obtenidaEn } : {}),
	};
}

/**
 * Otorga al usuario todas las recompensas activas cuya condición ya cumple y
 * que todavía no tiene (RF-015). Es idempotente: si una recompensa ya estaba
 * otorgada (o dos requests simultáneas la otorgan a la vez y el UNIQUE
 * usuario_id + recompensa_id rechaza a una), no se duplica ni falla.
 *
 * Devuelve solo las recompensas NUEVAS de esta llamada.
 */
export async function otorgarPendientes(usuarioId, estado) {
	const [activas, obtenidas] = await Promise.all([
		recompensaRepository.findAllActivas(),
		recompensaObtenidaRepository.findAllByUsuario(usuarioId),
	]);
	const obtenidasIds = new Set(obtenidas.map((obtenida) => obtenida.recompensa_id));

	const nuevas = [];

	for (const recompensa of activas) {
		if (obtenidasIds.has(recompensa.id) || !cumpleCondicion(recompensa, estado)) {
			continue;
		}

		try {
			const obtenida = await recompensaObtenidaRepository.create(usuarioId, recompensa.id);
			nuevas.push(aRecompensaEstudiante(recompensa, obtenida.obtenida_en));
		} catch (error) {
			// Otra request se adelantó y ya la otorgó: resultado idempotente.
			if (!esViolacionUnica(error)) {
				throw error;
			}
		}
	}

	return nuevas;
}

/**
 * Recompensas del estudiante: las ya obtenidas y las activas que aún no
 * desbloqueó (con su condición, para saber qué falta).
 */
export async function listarParaEstudiante(usuarioId) {
	const [activas, obtenidas] = await Promise.all([
		recompensaRepository.findAllActivas(),
		recompensaObtenidaRepository.findAllByUsuario(usuarioId),
	]);
	const obtenidasIds = new Set(obtenidas.map((obtenida) => obtenida.recompensa_id));

	return {
		obtenidas: obtenidas.map((obtenida) => aRecompensaEstudiante(obtenida.recompensa, obtenida.obtenida_en)),
		pendientes: activas
			.filter((recompensa) => !obtenidasIds.has(recompensa.id))
			.map((recompensa) => aRecompensaEstudiante(recompensa)),
	};
}
