import { verifyToken } from "../utils/jwt.util.js";

export default function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization || "";
	const [scheme, token] = authHeader.split(" ");

	if (scheme !== "Bearer" || !token) {
		return res.status(401).json({ message: "No autorizado. Falta el token de autenticación." });
	}

	try {
		const payload = verifyToken(token);
		req.user = { id: payload.id, rol: payload.rol };
		return next();
	} catch (_error) {
		return res.status(401).json({ message: "No autorizado. Token inválido o expirado." });
	}
}
