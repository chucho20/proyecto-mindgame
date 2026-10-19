import api from "./api.js";

/**
 * Recompensas del estudiante logueado (RF-015): `{ obtenidas: [...], pendientes: [...] }`.
 * Las obtenidas traen `obtenida_en`; las pendientes traen su condición
 * (`condicion_tipo` + `condicion_valor`) para mostrar qué falta.
 */
export async function getRewards() {
	const { data } = await api.get("/recompensas");
	return data;
}
