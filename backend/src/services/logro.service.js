import { esViolacionUnica } from "../utils/dbErrors.js";
import { cumpleCondicion } from "../utils/condiciones.js";
import * as logroRepository from "../repositories/logro.repository.js";
import * as logroObtenidoRepository from "../repositories/logroObtenido.repository.js";

// Forma que ve el estudiante (snake_case). `obtenido_en` solo existe en los ya obtenidos.
function aLogroEstudiante(logro, obtenidoEn) {
	return {
		id: logro.id,
		nombre: logro.nombre,
		descripcion: logro.descripcion,
		icono: logro.icono,
		condicion_tipo: logro.condicion_tipo,
		condicion_valor: logro.condicion_valor,
		...(obtenidoEn ? { obtenido_en: obtenidoEn } : {}),
	};
}

/**
 * Otorga al usuario todos los logros activos cuya condición ya cumple y que
 * todavía no tiene. Es idempotente: si un logro ya estaba otorgado (o dos
 * requests simultáneas lo otorgan a la vez y el UNIQUE usuario_id + logro_id
 * rechaza a una), no se duplica ni falla.
 *
 * Devuelve solo los logros NUEVOS de esta llamada.
 */
export async function otorgarPendientes(usuarioId, estado) {
	const [activos, obtenidos] = await Promise.all([
		logroRepository.findAllActivos(),
		logroObtenidoRepository.findAllByUsuario(usuarioId),
	]);
	const obtenidosIds = new Set(obtenidos.map((obtenido) => obtenido.logro_id));

	const nuevos = [];

	for (const logro of activos) {
		if (obtenidosIds.has(logro.id) || !cumpleCondicion(logro, estado)) {
			continue;
		}

		try {
			const obtenido = await logroObtenidoRepository.create(usuarioId, logro.id);
			nuevos.push(aLogroEstudiante(logro, obtenido.obtenido_en));
		} catch (error) {
			// Otra request se adelantó y ya lo otorgó: resultado idempotente.
			if (!esViolacionUnica(error)) {
				throw error;
			}
		}
	}

	return nuevos;
}

/**
 * Logros del estudiante (RF-020): los ya obtenidos y los activos que aún no
 * desbloqueó, con su condición visible.
 */
export async function listarParaEstudiante(usuarioId) {
	const [activos, obtenidos] = await Promise.all([
		logroRepository.findAllActivos(),
		logroObtenidoRepository.findAllByUsuario(usuarioId),
	]);
	const obtenidosIds = new Set(obtenidos.map((obtenido) => obtenido.logro_id));

	return {
		obtenidos: obtenidos.map((obtenido) => aLogroEstudiante(obtenido.logro, obtenido.obtenido_en)),
		pendientes: activos
			.filter((logro) => !obtenidosIds.has(logro.id))
			.map((logro) => aLogroEstudiante(logro)),
	};
}
