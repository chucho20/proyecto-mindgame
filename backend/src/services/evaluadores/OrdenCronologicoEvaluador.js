/**
 * Evaluador para retos de tipo `orden_cronologico` (RF-010): el estudiante
 * ordena una lista de eventos.
 *
 * `reto.respuesta_correcta` es un arreglo de ids en el orden correcto, ej:
 * ["2", "1", "3"]. `respuestaUsuario` debe ser un arreglo de ids en el orden
 * elegido por el estudiante. Es correcto solo si el orden coincide exacto.
 *
 * @type {import("./EvaluadorDeReto.js")}
 */
export function evaluar(reto, respuestaUsuario) {
	const esperado = reto.respuesta_correcta;

	if (!Array.isArray(respuestaUsuario) || !Array.isArray(esperado)) {
		return { esCorrecto: false, puntosObtenidos: 0 };
	}

	const esCorrecto =
		esperado.length === respuestaUsuario.length &&
		esperado.every((id, index) => String(id) === String(respuestaUsuario[index]));

	return {
		esCorrecto,
		puntosObtenidos: esCorrecto ? reto.puntos : 0,
	};
}

export default { evaluar };
