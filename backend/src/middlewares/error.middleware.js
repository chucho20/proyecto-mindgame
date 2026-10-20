import AppError from "../utils/AppError.js";
import { registrarError } from "../utils/logger.js";

/**
 * Cierre de la cadena de Express: rutas inexistentes y errores que escapan de los controllers
 * (cuerpo JSON mal formado, cuerpo demasiado grande, fallos inesperados). Siempre responde JSON
 * `{ message }`, nunca la página HTML de Express, y nunca incluye trazas ni detalles de SQL/Prisma.
 */

// Errores de body-parser / http-errors que son culpa del cliente: mensaje fijo, sin eco del contenido.
const ERRORES_DE_CLIENTE = {
	"entity.parse.failed": [400, "El cuerpo de la petición no es un JSON válido."],
	"entity.too.large": [413, "El cuerpo de la petición es demasiado grande."],
	"encoding.unsupported": [415, "La codificación del cuerpo de la petición no está soportada."],
	"charset.unsupported": [415, "El juego de caracteres del cuerpo de la petición no está soportado."],
	"request.aborted": [400, "La petición se interrumpió antes de terminar."],
	"request.size.invalid": [400, "El tamaño de la petición no es válido."],
	"stream.encoding.set": [400, "La petición no se pudo leer."],
	"parameters.too.many": [413, "La petición tiene demasiados parámetros."],
};

export function rutaNoEncontrada(_req, res) {
	return res.status(404).json({ message: "Recurso no encontrado." });
}

// Express exige los 4 parámetros para reconocer un manejador de errores.
// eslint-disable-next-line no-unused-vars
export function manejadorDeErrores(error, req, res, next) {
	if (res.headersSent) {
		return req.socket.destroy();
	}

	if (error instanceof AppError) {
		return res.status(error.statusCode).json({
			message: error.message,
			...(error.details && error.details.length > 0 ? { details: error.details } : {}),
		});
	}

	const conocido = ERRORES_DE_CLIENTE[error?.type];
	if (conocido) {
		return res.status(conocido[0]).json({ message: conocido[1] });
	}

	// Cualquier otro 4xx lanzado por Express (p. ej. un verbo inválido) se informa sin su texto original.
	if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
		return res.status(error.status).json({ message: "La petición no es válida." });
	}

	registrarError("la API", error);
	return res.status(500).json({ message: "Ocurrió un error inesperado. Intentá de nuevo más tarde." });
}
