/**
 * Contrato (Strategy) que debe implementar todo evaluador de retos (RNF-012).
 * JS no tiene interfaces reales: este archivo documenta la forma vía JSDoc y
 * sirve de referencia para cada evaluador concreto. No se instancia.
 *
 * @typedef {Object} ResultadoEvaluacion
 * @property {boolean} esCorrecto - Si la respuesta del estudiante es correcta.
 * @property {number} puntosObtenidos - Puntos otorgados (0 si es incorrecta).
 */

/**
 * @typedef {Object} EvaluadorDeReto
 * @property {(reto: Object, respuestaUsuario: *) => ResultadoEvaluacion} evaluar
 *   Evalúa la respuesta del estudiante contra el reto.
 *   - `reto`: fila completa de la tabla `retos` (incluye `tipo`, `opciones`,
 *     `respuesta_correcta`, `puntos`).
 *   - `respuestaUsuario`: respuesta enviada por el estudiante, cuya forma
 *     depende de `reto.tipo` (ver cada evaluador concreto).
 *   Devuelve siempre `{ esCorrecto, puntosObtenidos }`, nunca lanza por una
 *   respuesta "mal formada" del estudiante (la trata como incorrecta).
 */

export default {};
