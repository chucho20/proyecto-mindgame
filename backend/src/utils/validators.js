import { AVATAR_IDS } from "../constants/avatars.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ["estudiante", "docente"];

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

const INT_MAXIMO = 2147483647;

/**
 * Indica si `value` es un entero que entra en una columna INT de la base de datos
 * (acepta número o texto numérico, como el resto de validaciones del backend).
 * Prisma rechaza con un error de runtime los decimales, los no numéricos y los que
 * se salen de rango, y eso terminaría en un 500: acá se corta antes con un 400.
 */
export function esEnteroValido(value, { min = -INT_MAXIMO - 1 } = {}) {
	const esNumeroOTextoNumerico =
		typeof value === "number" || (typeof value === "string" && value.trim().length > 0);

	if (!esNumeroOTextoNumerico) {
		return false;
	}

	const numero = Number(value);
	return Number.isInteger(numero) && numero >= min && numero <= INT_MAXIMO;
}

/**
 * Valida el payload de registro (RF-001).
 * Devuelve un arreglo de mensajes de error. Vacío significa payload válido.
 */
export function validateRegister(data = {}) {
	const errors = [];

	if (!isNonEmptyString(data.nombreCompleto)) {
		errors.push("El nombre completo es obligatorio.");
	}

	if (!isNonEmptyString(data.correo)) {
		errors.push("El correo es obligatorio.");
	} else if (!EMAIL_REGEX.test(data.correo.trim())) {
		errors.push("El correo no tiene un formato válido.");
	}

	if (!isNonEmptyString(data.nombreUsuario)) {
		errors.push("El nombre de usuario es obligatorio.");
	}

	if (!isNonEmptyString(data.password)) {
		errors.push("La contraseña es obligatoria.");
	} else if (data.password.length < 8) {
		errors.push("La contraseña debe tener al menos 8 caracteres.");
	}

	if (data.edad !== undefined && data.edad !== null && data.edad !== "") {
		const edadNum = Number(data.edad);
		if (!Number.isInteger(edadNum) || edadNum <= 0) {
			errors.push("La edad debe ser un número entero positivo.");
		}
	}

	if (data.gradoCurso !== undefined && data.gradoCurso !== null && typeof data.gradoCurso !== "string") {
		errors.push("El grado/curso no es válido.");
	}

	if (!isNonEmptyString(data.rol) || !ALLOWED_ROLES.includes(data.rol)) {
		errors.push("El rol debe ser 'estudiante' o 'docente'.");
	}

	if (data.avatar !== undefined && data.avatar !== null && !AVATAR_IDS.includes(data.avatar)) {
		errors.push("El avatar seleccionado no existe.");
	}

	if (data.aceptaTratamientoDatos !== true) {
		errors.push("Debés aceptar el tratamiento de datos personales para continuar.");
	}

	return errors;
}

/**
 * Valida el payload de login (RF-002).
 */
export function validateLogin(data = {}) {
	const errors = [];

	if (!isNonEmptyString(data.correo)) {
		errors.push("El correo es obligatorio.");
	}

	if (!isNonEmptyString(data.password)) {
		errors.push("La contraseña es obligatoria.");
	}

	return errors;
}

/**
 * Valida el payload de actualización de perfil (RF-005 / RF-006).
 */
export function validateProfileUpdate(data = {}) {
	const errors = [];
	const hasAny =
		data.nombreCompleto !== undefined ||
		data.edad !== undefined ||
		data.gradoCurso !== undefined ||
		data.avatar !== undefined;

	if (!hasAny) {
		errors.push("No se enviaron campos para actualizar.");
		return errors;
	}

	if (data.nombreCompleto !== undefined && !isNonEmptyString(data.nombreCompleto)) {
		errors.push("El nombre completo no puede estar vacío.");
	}

	if (data.edad !== undefined && data.edad !== null && data.edad !== "") {
		const edadNum = Number(data.edad);
		if (!Number.isInteger(edadNum) || edadNum <= 0) {
			errors.push("La edad debe ser un número entero positivo.");
		}
	}

	if (data.gradoCurso !== undefined && data.gradoCurso !== null && typeof data.gradoCurso !== "string") {
		errors.push("El grado/curso no es válido.");
	}

	if (data.avatar !== undefined && data.avatar !== null && !AVATAR_IDS.includes(data.avatar)) {
		errors.push("El avatar seleccionado no existe.");
	}

	return errors;
}

/**
 * Valida el payload de "olvidé mi contraseña".
 */
export function validateForgotPassword(data = {}) {
	const errors = [];

	if (!isNonEmptyString(data.correo)) {
		errors.push("El correo es obligatorio.");
	}

	return errors;
}

/**
 * Valida el payload de restablecimiento de contraseña.
 */
export function validateResetPassword(data = {}) {
	const errors = [];

	if (!isNonEmptyString(data.token)) {
		errors.push("El token es obligatorio.");
	}

	if (!isNonEmptyString(data.password)) {
		errors.push("La nueva contraseña es obligatoria.");
	} else if (data.password.length < 8) {
		errors.push("La contraseña debe tener al menos 8 caracteres.");
	}

	return errors;
}
