import AppError from "./AppError.js";

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

	console.error(`Error inesperado en ${context}:`, error);
	return res.status(500).json({ message: "Ocurrió un error inesperado. Intentá de nuevo más tarde." });
}
