import AppError from "../utils/AppError.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";
import * as nivelRepository from "../repositories/nivel.repository.js";
import * as progresoMisionRepository from "../repositories/progresoMision.repository.js";
import * as recompensaService from "./recompensa.service.js";
import * as logroService from "./logro.service.js";

/**
 * ServicioDeProgreso (SDD): lógica central de puntos y niveles. Lo invocan los
 * flujos que dan puntos (retos, actividades) y la consulta de progreso del
 * estudiante, para no duplicar la regla de puntuación.
 */

/**
 * Nivel que le corresponde a un total de puntos: el mayor `numero` cuyo
 * `puntos_requeridos` ya se alcanzó. Devuelve `null` si no hay niveles
 * definidos (el llamador conserva entonces el nivel que ya tenía).
 */
function calcularNivel(niveles, puntos) {
	const alcanzados = niveles.filter((nivel) => puntos >= nivel.puntos_requeridos);
	if (alcanzados.length === 0) {
		return null;
	}

	return Math.max(...alcanzados.map((nivel) => nivel.numero));
}

/**
 * Recalcula el nivel del usuario a partir de sus puntos actuales y, con el
 * estado resultante, otorga las recompensas y logros que correspondan. No suma
 * puntos: sirve también para reevaluar a un usuario sin que gane puntos (por
 * ejemplo si se crea una recompensa nueva). El nivel nunca baja.
 */
export async function reevaluarProgresion(usuarioId) {
	const [usuario, niveles] = await Promise.all([
		usuarioRepository.findById(usuarioId),
		nivelRepository.findAll(),
	]);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	const nivelNuevo = calcularNivel(niveles, usuario.puntos_totales);
	const usuarioActualizado =
		nivelNuevo !== null && nivelNuevo > usuario.nivel_actual
			? await usuarioRepository.subirNivel(usuarioId, nivelNuevo)
			: usuario;

	const estado = { puntos: usuarioActualizado.puntos_totales, nivel: usuarioActualizado.nivel_actual };
	const recompensasNuevas = await recompensaService.otorgarPendientes(usuarioId, estado);
	const logrosNuevos = await logroService.otorgarPendientes(usuarioId, estado);

	return {
		puntos_totales: estado.puntos,
		nivel_actual: estado.nivel,
		recompensas_nuevas: recompensasNuevas,
		logros_nuevos: logrosNuevos,
	};
}

/**
 * Suma puntos al usuario (RF-014), recalcula su nivel (RF-016) y otorga las
 * recompensas y logros que desbloquee (RF-015). Quien llama decide CUÁNDO
 * corresponde dar puntos (no duplicar por una misma acción); este método
 * solo ejecuta la suma.
 */
export async function asignarPuntos(usuarioId, puntos) {
	if (!Number.isInteger(puntos) || puntos <= 0) {
		throw new AppError("Los puntos a asignar deben ser un número entero mayor que cero.", 400);
	}

	const antes = await usuarioRepository.findById(usuarioId);
	if (!antes) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	await usuarioRepository.sumarPuntos(usuarioId, puntos);
	const resultado = await reevaluarProgresion(usuarioId);

	return {
		puntos_agregados: puntos,
		puntos_totales: resultado.puntos_totales,
		nivel_anterior: antes.nivel_actual,
		nivel_actual: resultado.nivel_actual,
		subio_de_nivel: resultado.nivel_actual > antes.nivel_actual,
		recompensas_nuevas: resultado.recompensas_nuevas,
		logros_nuevos: resultado.logros_nuevos,
	};
}

/**
 * Resumen de progreso del estudiante (RF-017): nivel, puntos, avance hacia el
 * siguiente nivel y misiones completadas. Las claves `puntos`, `nivel_actual`,
 * `siguiente_nivel`, `puntos_siguiente_nivel` y `misiones_completadas` son las
 * que lee la ProgressPage del frontend.
 */
export async function consultarProgreso(usuarioId) {
	const [usuario, niveles, misionesCompletadas] = await Promise.all([
		usuarioRepository.findById(usuarioId),
		nivelRepository.findAll(),
		progresoMisionRepository.findCompletadasConMision(usuarioId),
	]);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	const puntos = usuario.puntos_totales;
	const nivelActual = niveles.find((nivel) => nivel.numero === usuario.nivel_actual);
	const siguiente = niveles.find((nivel) => nivel.numero > usuario.nivel_actual) ?? null;

	const puntosNivelActual = nivelActual ? nivelActual.puntos_requeridos : 0;

	// Porcentaje recorrido DENTRO del nivel actual (de su umbral al del siguiente).
	let porcentajeAvance = 100;
	if (siguiente) {
		const tramo = siguiente.puntos_requeridos - puntosNivelActual;
		porcentajeAvance =
			tramo > 0 ? Math.min(100, Math.max(0, Math.floor(((puntos - puntosNivelActual) / tramo) * 100))) : 100;
	}

	return {
		puntos,
		nivel_actual: usuario.nivel_actual,
		puntos_nivel_actual: puntosNivelActual,
		siguiente_nivel: siguiente ? siguiente.numero : null,
		puntos_siguiente_nivel: siguiente ? siguiente.puntos_requeridos : null,
		puntos_restantes: siguiente ? Math.max(0, siguiente.puntos_requeridos - puntos) : 0,
		porcentaje_avance: porcentajeAvance,
		nivel_maximo: siguiente === null,
		misiones_completadas: misionesCompletadas.map((mision) => ({
			id: mision.mision_id,
			titulo: mision.titulo,
			descripcion: mision.descripcion,
			categoria: mision.categoria,
			completada_en: mision.completada_en,
		})),
	};
}
