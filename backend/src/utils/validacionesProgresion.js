import {
	LONGITUD_MAXIMA_TEXTO,
	esEnteroValido,
	esTextoOpcionalValido,
	normalizarTextoOpcional,
} from "./validators.js";

// Recompensas y logros comparten forma y reglas: nombre, descripción, ícono y una
// condición (`puntos` o `nivel` + valor) que el servicio de progreso evalúa.
export const TIPOS_CONDICION = ["puntos", "nivel"];
export const ESTADOS_PROGRESION = ["activa", "inactiva"];

const LONGITUD_MAXIMA_NOMBRE = 150;
const LONGITUD_MAXIMA_ICONO = 100;

/**
 * La API es snake_case (`condicion_tipo`, `condicion_valor`). El formulario de
 * recompensas del frontend envía hoy `tipoCondicion` / `valorCondicion`, así que se
 * aceptan como alias; si llegan las dos formas, gana la snake_case.
 */
function leerCondicion(data) {
	return {
		tipo: data.condicion_tipo !== undefined ? data.condicion_tipo : data.tipoCondicion,
		valor: data.condicion_valor !== undefined ? data.condicion_valor : data.valorCondicion,
	};
}

/**
 * Valida el payload de una recompensa o un logro. Devuelve los mensajes de error
 * (vacío = válido). En la actualización solo se validan los campos enviados.
 */
export function validarItemProgresion(data, { esCreacion }) {
	const errors = [];

	if (esCreacion || data.nombre !== undefined) {
		if (typeof data.nombre !== "string" || data.nombre.trim().length === 0) {
			errors.push("El nombre es obligatorio.");
		} else if (data.nombre.trim().length > LONGITUD_MAXIMA_NOMBRE) {
			errors.push(`El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`);
		}
	}

	if (!esTextoOpcionalValido(data.descripcion)) {
		errors.push(`La descripción debe ser texto de hasta ${LONGITUD_MAXIMA_TEXTO} caracteres.`);
	}

	if (!esTextoOpcionalValido(data.icono, { max: LONGITUD_MAXIMA_ICONO })) {
		errors.push(`El ícono debe ser texto de hasta ${LONGITUD_MAXIMA_ICONO} caracteres.`);
	}

	const { tipo, valor } = leerCondicion(data);

	if ((esCreacion || tipo !== undefined) && !TIPOS_CONDICION.includes(tipo)) {
		errors.push(`El tipo de condición debe ser uno de: ${TIPOS_CONDICION.join(", ")}.`);
	}

	if ((esCreacion || valor !== undefined) && !esEnteroValido(valor, { min: 0 })) {
		errors.push("El valor de la condición debe ser un número entero mayor o igual a 0.");
	}

	return errors;
}

/**
 * Deja el payload ya validado en la forma que esperan los repositorios
 * (`undefined` = "no tocar"; descripción o ícono vacíos pasan a `null`).
 */
export function normalizarItemProgresion(data) {
	const { tipo, valor } = leerCondicion(data);

	return {
		nombre: data.nombre !== undefined ? data.nombre.trim() : undefined,
		descripcion: normalizarTextoOpcional(data.descripcion),
		icono: normalizarTextoOpcional(data.icono),
		condicion_tipo: tipo,
		condicion_valor: valor !== undefined ? Number(valor) : undefined,
	};
}
