/**
 * Evaluador para retos de tipo `relacion_elementos` (RF-010): el estudiante
 * empareja elementos de una columna izquierda con una derecha.
 *
 * `reto.respuesta_correcta` es un objeto plano { idIzquierda: idDerecha, ... }.
 * `respuestaUsuario` debe tener la misma forma. Es correcto solo si TODOS los
 * pares coinciden (sin puntaje parcial, coherente con `puntos` fijo por reto).
 *
 * @type {import("./EvaluadorDeReto.js")}
 */
export function evaluar(reto, respuestaUsuario) {
	const esperado = reto.respuesta_correcta;

	if (
		!respuestaUsuario ||
		typeof respuestaUsuario !== "object" ||
		Array.isArray(respuestaUsuario) ||
		!esperado ||
		typeof esperado !== "object"
	) {
		return { esCorrecto: false, puntosObtenidos: 0 };
	}

	const clavesEsperadas = Object.keys(esperado);
	const clavesRecibidas = Object.keys(respuestaUsuario);

	const esCorrecto =
		clavesEsperadas.length === clavesRecibidas.length &&
		clavesEsperadas.every((clave) => String(respuestaUsuario[clave]) === String(esperado[clave]));

	return {
		esCorrecto,
		puntosObtenidos: esCorrecto ? reto.puntos : 0,
	};
}

export default { evaluar };
