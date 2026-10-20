import AppError from "./AppError.js";
import { registrarError } from "./logger.js";

/**
 * Manejo de errores compartido por todos los controllers (mismo comportamiento
 * que las funciones locales `handleError` que repetían auth.controller.js y
 * profile.controller.js antes de esta extracción).
 */
export default function handleError(res, error, context = "controller") {
	if (error instanceof AppError) {
		return res.status(error.statusCode).json({
			message: error.message,
			...(error.details && error.details.length > 0 ? { details: error.details } : {}),
		});
	}

	// Al cliente nunca le llega el detalle (SQL, Prisma, trazas): solo un mensaje genérico.
	registrarError(context, error);
	return res.status(500).json({ message: "Ocurrió un error inesperado. Intentá de nuevo más tarde." });
}
