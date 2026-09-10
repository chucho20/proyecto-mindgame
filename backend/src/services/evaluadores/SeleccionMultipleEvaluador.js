/**
 * Evaluador para retos de tipo `seleccion_multiple` (RF-010).
 * `reto.respuesta_correcta` es el id (string) de la opción correcta, ej: "b".
 * `respuestaUsuario` es el id de la opción elegida por el estudiante, ej: "b".
 *
 * @type {import("./EvaluadorDeReto.js")}
 */
export function evaluar(reto, respuestaUsuario) {
	const esCorrecto = String(respuestaUsuario) === String(reto.respuesta_correcta);

	return {
		esCorrecto,
		puntosObtenidos: esCorrecto ? reto.puntos : 0,
	};
}

export default { evaluar };
