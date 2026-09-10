/**
 * Evaluador para retos de tipo `verdadero_falso` (RF-010).
 * `reto.respuesta_correcta` es un booleano (true/false).
 * `respuestaUsuario` es el booleano elegido por el estudiante.
 *
 * @type {import("./EvaluadorDeReto.js")}
 */
export function evaluar(reto, respuestaUsuario) {
	const esperado = reto.respuesta_correcta === true || reto.respuesta_correcta === "true";
	const recibido = respuestaUsuario === true || respuestaUsuario === "true";
	const esCorrecto = esperado === recibido;

	return {
		esCorrecto,
		puntosObtenidos: esCorrecto ? reto.puntos : 0,
	};
}

export default { evaluar };
