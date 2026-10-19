import api from "./api.js";

/**
 * Logros del estudiante logueado (RF-015): `{ obtenidos: [...], pendientes: [...] }`.
 * Los obtenidos traen `obtenido_en`; los pendientes traen su condición
 * (`condicion_tipo` + `condicion_valor`) para mostrar qué falta.
 */
export async function getAchievements() {
	const { data } = await api.get("/logros");
	return data;
}
