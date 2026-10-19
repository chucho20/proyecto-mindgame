/**
 * Indica si un usuario cumple la condición de una recompensa o de un logro.
 *
 * - `condicion_tipo = "puntos"`: puntos totales >= `condicion_valor`.
 * - `condicion_tipo = "nivel"`: nivel actual >= `condicion_valor`.
 *
 * Cualquier otro tipo de condición se considera no cumplido.
 */
export function cumpleCondicion(item, { puntos, nivel }) {
	if (item.condicion_tipo === "puntos") {
		return puntos >= item.condicion_valor;
	}

	if (item.condicion_tipo === "nivel") {
		return nivel >= item.condicion_valor;
	}

	return false;
}
