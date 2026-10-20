import { AVATAR_IDS } from "../constants/avatars.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ["estudiante", "docente"];

// Topes alineados con las columnas VARCHAR de la tabla usuarios y con el límite útil de bcrypt (72 bytes).
const MAX_NOMBRE_COMPLETO = 150;
const MAX_CORREO = 150;
const MAX_NOMBRE_USUARIO = 50;
const MAX_GRADO_CURSO = 50;
const MAX_PASSWORD = 128;
const MAX_CODIGO_DOCENTE = 100;
const MAX_EDAD = 120;
const LONGITUD_TOKEN_RESET = 64;
const TOKEN_RESET_REGEX = /^[a-f0-9]{64}$/i;

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

// Texto obligatorio con tope de largo. Un arreglo, un objeto o un número NO son un texto: dan error de validación (400).
function validarTexto(errors, value, { vacio, largo, max }) {
	if (!isNonEmptyString(value)) {
		errors.push(vacio);
		return false;
	}

	if (value.length > max) {
		errors.push(largo);
		return false;
	}

	return true;
}

// Edad opcional: entero entre 1 y MAX_EDAD (120). Acepta número o texto decimal simple ("12"), no "1e3" ni arreglos.
function edadInvalida(edad) {
	if (edad === undefined || edad === null || edad === "") {
		return false;
	}

	return !esEnteroValido(edad, { min: 1 }) || Number(edad) > MAX_EDAD;
}

const INT_MAXIMO = 2147483647;
const ENTERO_DECIMAL_REGEX = /^-?\d+$/;

/**
 * Indica si `value` es un entero que entra en una columna INT de la base de datos
 * (acepta número o texto con un entero decimal simple, como "7" o "-3").
 * Prisma rechaza con un error de runtime los decimales, los no numéricos y los que
 * se salen de rango, y eso terminaría en un 500: acá se corta antes con un 400.
 * Los textos en otras notaciones que `Number()` sí interpreta ("0x10", "1e3", " 5 ")
 * y el cero negativo ("-0") se rechazan, para no guardar un valor distinto del escrito.
 */
export function esEnteroValido(value, { min = -INT_MAXIMO - 1 } = {}) {
	const esNumeroOEnteroDecimal =
		typeof value === "number" || (typeof value === "string" && ENTERO_DECIMAL_REGEX.test(value));

	if (!esNumeroOEnteroDecimal) {
		return false;
	}

	const numero = Number(value);
	return Number.isInteger(numero) && !Object.is(numero, -0) && numero >= min && numero <= INT_MAXIMO;
}

// Tope de caracteres para textos largos (columnas TEXT): evita que un body enorme
// termine en un error de la base de datos (500) en vez de un 400.
export const LONGITUD_MAXIMA_TEXTO = 2000;

/**
 * Indica si `value` sirve para una columna de texto opcional: no enviado
 * (`undefined`), `null` (dejar vacío) o un string que no supere el tope.
 */
export function esTextoOpcionalValido(value, { max = LONGITUD_MAXIMA_TEXTO } = {}) {
	return value === undefined || value === null || (typeof value === "string" && value.length <= max);
}

/**
 * Normaliza un texto opcional ya validado: `undefined` se conserva ("no tocar"),
 * y un texto vacío o solo con espacios pasa a `null`.
 */
export function normalizarTextoOpcional(value) {
	if (typeof value !== "string") {
		return value;
	}

	const texto = value.trim();
	return texto.length > 0 ? texto : null;
}

/**
 * Valida el payload de registro (RF-001).
 * Devuelve un arreglo de mensajes de error. Vacío significa payload válido.
 */
export function validateRegister(data = {}) {
	const errors = [];

	validarTexto(errors, data.nombreCompleto, {
		vacio: "El nombre completo es obligatorio.",
		largo: `El nombre completo no puede superar los ${MAX_NOMBRE_COMPLETO} caracteres.`,
		max: MAX_NOMBRE_COMPLETO,
	});

	if (
		validarTexto(errors, data.correo, {
			vacio: "El correo es obligatorio.",
			largo: `El correo no puede superar los ${MAX_CORREO} caracteres.`,
			max: MAX_CORREO,
		}) &&
		!EMAIL_REGEX.test(data.correo.trim())
	) {
		errors.push("El correo no tiene un formato válido.");
	}

	validarTexto(errors, data.nombreUsuario, {
		vacio: "El nombre de usuario es obligatorio.",
		largo: `El nombre de usuario no puede superar los ${MAX_NOMBRE_USUARIO} caracteres.`,
		max: MAX_NOMBRE_USUARIO,
	});

	if (
		validarTexto(errors, data.password, {
			vacio: "La contraseña es obligatoria.",
			largo: `La contraseña no puede superar los ${MAX_PASSWORD} caracteres.`,
			max: MAX_PASSWORD,
		}) &&
		data.password.length < 8
	) {
		errors.push("La contraseña debe tener al menos 8 caracteres.");
	}

	if (edadInvalida(data.edad)) {
		errors.push(`La edad debe ser un número entero entre 1 y ${MAX_EDAD}.`);
	}

	if (
		data.gradoCurso !== undefined &&
		data.gradoCurso !== null &&
		(typeof data.gradoCurso !== "string" || data.gradoCurso.length > MAX_GRADO_CURSO)
	) {
		errors.push("El grado/curso no es válido.");
	}

	if (!isNonEmptyString(data.rol) || !ALLOWED_ROLES.includes(data.rol)) {
		errors.push("El rol debe ser 'estudiante' o 'docente'.");
	}

	if (
		data.codigoDocente !== undefined &&
		data.codigoDocente !== null &&
		(typeof data.codigoDocente !== "string" || data.codigoDocente.length > MAX_CODIGO_DOCENTE)
	) {
		errors.push("El código de docente no es válido.");
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

	validarTexto(errors, data.correo, {
		vacio: "El correo es obligatorio.",
		largo: "El correo no es válido.",
		max: MAX_CORREO,
	});

	validarTexto(errors, data.password, {
		vacio: "La contraseña es obligatoria.",
		largo: "La contraseña no es válida.",
		max: MAX_PASSWORD,
	});

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

	if (data.nombreCompleto !== undefined) {
		if (!isNonEmptyString(data.nombreCompleto)) {
			errors.push("El nombre completo no puede estar vacío.");
		} else if (data.nombreCompleto.length > MAX_NOMBRE_COMPLETO) {
			errors.push(`El nombre completo no puede superar los ${MAX_NOMBRE_COMPLETO} caracteres.`);
		}
	}

	if (edadInvalida(data.edad)) {
		errors.push(`La edad debe ser un número entero entre 1 y ${MAX_EDAD}.`);
	}

	if (
		data.gradoCurso !== undefined &&
		data.gradoCurso !== null &&
		(typeof data.gradoCurso !== "string" || data.gradoCurso.length > MAX_GRADO_CURSO)
	) {
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

	validarTexto(errors, data.correo, {
		vacio: "El correo es obligatorio.",
		largo: "El correo no es válido.",
		max: MAX_CORREO,
	});

	return errors;
}

/**
 * Valida el payload de restablecimiento de contraseña.
 */
export function validateResetPassword(data = {}) {
	const errors = [];

	if (!isNonEmptyString(data.token)) {
		errors.push("El token es obligatorio.");
	} else if (data.token.length !== LONGITUD_TOKEN_RESET || !TOKEN_RESET_REGEX.test(data.token)) {
		errors.push("El token no es válido.");
	}

	if (
		validarTexto(errors, data.password, {
			vacio: "La nueva contraseña es obligatoria.",
			largo: `La contraseña no puede superar los ${MAX_PASSWORD} caracteres.`,
			max: MAX_PASSWORD,
		}) &&
		data.password.length < 8
	) {
		errors.push("La contraseña debe tener al menos 8 caracteres.");
	}

	return errors;
}
