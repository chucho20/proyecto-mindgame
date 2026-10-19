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
 * Nivel guardado del usuario. Los flujos que suman puntos dentro de su propia
 * transacción lo leen ANTES, para informar el nivel anterior en la respuesta.
 */
export async function obtenerNivelActual(usuarioId) {
	const usuario = await usuarioRepository.findById(usuarioId);
	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	return usuario.nivel_actual;
}

/**
 * Evalúa nivel, recompensas y logros DESPUÉS de que los puntos ya se sumaron a
 * `usuarios.puntos_totales` (dentro de la misma transacción que registró el
 * intento o la actividad completada). Es un paso idempotente derivado del total
 * guardado: si el proceso se cae antes de llegar acá, `GET /api/progreso` vuelve
 * a ejecutar `reevaluarProgresion` y deja nivel, recompensas y logros al día.
 */
export async function evaluarProgresionTrasPuntos(usuarioId, puntosAgregados, nivelAnterior) {
	const resultado = await reevaluarProgresion(usuarioId);

	return {
		puntos_agregados: puntosAgregados,
		puntos_totales: resultado.puntos_totales,
		nivel_anterior: nivelAnterior,
		nivel_actual: resultado.nivel_actual,
		subio_de_nivel: resultado.nivel_actual > nivelAnterior,
		recompensas_nuevas: resultado.recompensas_nuevas,
		logros_nuevos: resultado.logros_nuevos,
	};
}

/**
 * Suma puntos al usuario (RF-014), recalcula su nivel (RF-016) y otorga las
 * recompensas y logros que desbloquee (RF-015). Quien llama decide CUÁNDO
 * corresponde dar puntos (no duplicar por una misma acción); este método
 * solo ejecuta la suma.
 *
 * La suma y la evaluación NO son una sola transacción: sirve para otorgar puntos
 * "sueltos". Los flujos que además persisten algo que impide repetir el premio
 * (intento de reto, actividad completada) deben sumar los puntos en SU transacción
 * y llamar después a `evaluarProgresionTrasPuntos`.
 */
export async function asignarPuntos(usuarioId, puntos) {
	if (!Number.isInteger(puntos) || puntos <= 0) {
		throw new AppError("Los puntos a asignar deben ser un número entero mayor que cero.", 400);
	}

	const nivelAnterior = await obtenerNivelActual(usuarioId);

	await usuarioRepository.sumarPuntos(usuarioId, puntos);

	return evaluarProgresionTrasPuntos(usuarioId, puntos, nivelAnterior);
}

/**
 * Resumen de progreso del estudiante (RF-017): nivel, puntos, avance hacia el
 * siguiente nivel y misiones completadas. Las claves `puntos`, `nivel_actual`,
 * `siguiente_nivel`, `puntos_siguiente_nivel` y `misiones_completadas` son las
 * que lee la ProgressPage del frontend.
 */
export async function consultarProgreso(usuarioId) {
	// Autocuración: el nivel, las recompensas y los logros se derivan de los puntos
	// guardados. Si una respuesta se cayó después de confirmar los puntos pero antes
	// de evaluarlos, acá se corrige (idempotente: no duplica nada ni baja el nivel).
	await reevaluarProgresion(usuarioId);

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
