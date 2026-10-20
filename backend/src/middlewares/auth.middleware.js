import { autenticarToken, SesionInvalidaError } from "../services/sesion.service.js";

const LONGITUD_MAXIMA_TOKEN = 2048;

export default async function authMiddleware(req, res, next) {
	// Varios routers montados bajo /api aplican este middleware: se autentica una sola vez por petición.
	if (req.user) {
		return next();
	}

	const authHeader = req.headers.authorization || "";
	const [scheme, token, ...resto] = authHeader.split(" ");

	if (scheme !== "Bearer" || !token || resto.length > 0) {
		return res.status(401).json({ message: "No autorizado. Falta el token de autenticación." });
	}

	if (token.length > LONGITUD_MAXIMA_TOKEN) {
		return res.status(401).json({ message: "No autorizado. Token inválido o expirado." });
	}

	try {
		const { id, rol } = await autenticarToken(token);
		req.user = { id, rol };
		return next();
	} catch (error) {
		if (error instanceof SesionInvalidaError) {
			return res.status(401).json({ message: "No autorizado. Token inválido o expirado." });
		}

		// Un fallo de la base de datos no es un token inválido: lo atiende el manejador final (500 genérico).
		return next(error);
	}
}
