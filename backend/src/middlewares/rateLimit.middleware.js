import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import env from "../config/env.js";

/**
 * Límites de intentos para los endpoints de autenticación (fuerza bruta, relleno de credenciales, spam de
 * correos de restablecimiento y creación masiva de cuentas). Almacén en memoria: sirve para UNA instancia
 * del servidor; con varias réplicas habría que pasar a un almacén compartido (p. ej. Redis).
 *
 * Los límites por IP son holgados a propósito: en un colegio muchos estudiantes salen por la misma IP.
 * Por eso el login solo cuenta los intentos FALLIDOS (`skipSuccessfulRequests`).
 */

const MENSAJE_GENERICO = "Demasiados intentos. Esperá unos minutos antes de volver a intentarlo.";

// Los limitadores se marcan para que la auditoría de rutas (scripts/listar-rutas.js) los distinga de los handlers.
function marcar(middleware) {
	middleware.esLimitador = true;
	return middleware;
}

function crearLimitador({ limit, mensaje = MENSAJE_GENERICO, ...opciones }) {
	if (!env.rateLimit.enabled) {
		return marcar((_req, _res, next) => next());
	}

	return marcar(
		rateLimit({
			windowMs: env.rateLimit.windowMs,
			limit,
			standardHeaders: "draft-7",
			legacyHeaders: false,
			handler: (_req, res) => res.status(429).json({ message: mensaje }),
			...opciones,
		}),
	);
}

// Clave por cuenta + IP: quien adivina la clave de una cuenta ajena se bloquea a sí mismo, pero no deja
// fuera al dueño real que entra desde otra IP.
function claveDeCuenta(req) {
	const correo =
		typeof req.body?.correo === "string" ? req.body.correo.trim().toLowerCase().slice(0, 150) : "";
	return `${ipKeyGenerator(req.ip)}|${correo}`;
}

/** Login: TODOS los intentos por IP (también los exitosos), con un tope alto contra la saturación de bcrypt. */
export const limitarLoginTotalPorIp = crearLimitador({
	limit: env.rateLimit.loginTotalMax,
	mensaje:
		"Demasiados intentos de inicio de sesión desde esta red. Esperá unos minutos antes de volver a intentarlo.",
});

/** Login: intentos fallidos por IP. Va ANTES de leer el cuerpo de la petición. */
export const limitarLoginPorIp = crearLimitador({
	limit: env.rateLimit.loginMax,
	skipSuccessfulRequests: true,
	mensaje: "Demasiados intentos de inicio de sesión. Esperá unos minutos antes de volver a intentarlo.",
});

/** Login: intentos fallidos por cuenta e IP. Necesita el cuerpo ya leído (usa `correo`). */
export const limitarLoginPorCuenta = crearLimitador({
	limit: env.rateLimit.loginAccountMax,
	skipSuccessfulRequests: true,
	keyGenerator: claveDeCuenta,
	mensaje: "Demasiados intentos con esta cuenta. Esperá unos minutos antes de volver a intentarlo.",
});

/** Registro: cuentas creadas por IP. */
export const limitarRegistro = crearLimitador({
	limit: env.rateLimit.registerMax,
	mensaje: "Se hicieron demasiados registros desde esta red. Esperá unos minutos e intentá de nuevo.",
});

/** "Olvidé mi contraseña": evita usar la API para llenar de correos la bandeja de otra persona. */
export const limitarRecuperacion = crearLimitador({
	limit: env.rateLimit.passwordResetMax,
	mensaje: "Hiciste demasiadas solicitudes de recuperación. Esperá unos minutos e intentá de nuevo.",
});

// Clave solo por correo: el límite vale aunque el atacante rote de IP. Responde igual exista o no la cuenta.
function claveDeCorreo(req) {
	return typeof req.body?.correo === "string" ? req.body.correo.trim().toLowerCase().slice(0, 150) : "";
}

/** "Olvidé mi contraseña": solicitudes por correo, desde cualquier IP. Necesita el cuerpo ya leído. */
export const limitarRecuperacionPorCuenta = crearLimitador({
	limit: env.rateLimit.passwordResetAccountMax,
	keyGenerator: claveDeCorreo,
	mensaje:
		"Hiciste demasiadas solicitudes de recuperación para este correo. Esperá unos minutos e intentá de nuevo.",
});

/** Restablecer contraseña: adivinar tokens. Solo cuentan los intentos fallidos. */
export const limitarRestablecimiento = crearLimitador({
	limit: env.rateLimit.passwordResetMax,
	skipSuccessfulRequests: true,
	mensaje: "Demasiados intentos de restablecer la contraseña. Esperá unos minutos e intentá de nuevo.",
});
