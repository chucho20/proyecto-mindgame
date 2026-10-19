// Formateo de las estadísticas del docente. El backend informa `null` cuando no
// hay datos (grupo vacío, estudiante sin intentos): se muestra "—", nunca NaN ni 0.

export const SIN_DATO = "—";

const formatoNumero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export function esNumero(valor) {
	return typeof valor === "number" && Number.isFinite(valor);
}

export function formatearNumero(valor) {
	return esNumero(valor) ? formatoNumero.format(valor) : SIN_DATO;
}

export function formatearPorcentaje(valor) {
	return esNumero(valor) ? `${formatoNumero.format(valor)}%` : SIN_DATO;
}

/** Color de la barra de acierto: verde desde 70%, ámbar desde 40% y rojo por debajo. */
export function tonoDeAcierto(porcentaje) {
	if (!esNumero(porcentaje)) {
		return "primary";
	}

	if (porcentaje >= 70) {
		return "success";
	}

	return porcentaje >= 40 ? "accent" : "error";
}

export function formatearFecha(valor) {
	if (!valor) {
		return SIN_DATO;
	}

	const fecha = new Date(valor);

	if (Number.isNaN(fecha.getTime())) {
		return SIN_DATO;
	}

	return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

/** Mensaje de error de una petición: prioriza `details` (validaciones) y luego `message`. */
export function mensajeDeError(err, fallback) {
	const details = err.response?.data?.details;

	return (
		(details && details.length > 0 ? details.join(" ") : null) || err.response?.data?.message || fallback
	);
}
