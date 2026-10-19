/**
 * Helpers de presentación para recompensas y logros (RF-015). El backend
 * evalúa dos tipos de condición: "puntos" (puntos totales) y "nivel".
 */

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

/** Texto legible de la condición de una recompensa o logro pendiente. */
export function describirCondicion(tipo, valor) {
	if (tipo === "puntos") {
		return `Reunir ${valor} puntos`;
	}

	if (tipo === "nivel") {
		return `Llegar al nivel ${valor}`;
	}

	return "";
}

/** Fecha larga en español ("15 de octubre de 2026"), o null si no es válida. */
export function formatearFecha(valor) {
	if (!valor) {
		return null;
	}

	const fecha = new Date(valor);

	return Number.isNaN(fecha.getTime()) ? null : FORMATO_FECHA.format(fecha);
}
