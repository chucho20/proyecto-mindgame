import jwt from "jsonwebtoken";

import env from "../config/env.js";

// El algoritmo se fija al firmar Y al verificar: sin `algorithms`, un token con `alg: none` o firmado
// con otro algoritmo (confusión HS/RS) podría llegar a aceptarse.
const ALGORITMO = "HS256";
export const ROLES_VALIDOS = ["estudiante", "docente", "administrador"];

export function signToken({ id, rol }) {
	return jwt.sign({ id, rol }, env.jwt.secret, {
		algorithm: ALGORITMO,
		expiresIn: env.jwt.expiresIn,
		issuer: env.jwt.issuer,
		audience: env.jwt.audience,
	});
}

/**
 * Verifica firma, algoritmo, emisor, audiencia y vigencia, y exige que el payload traiga un `id` entero
 * positivo y un `rol` conocido. Lanza si algo falla; devuelve el payload completo (incluye `exp`).
 * Lo usan tanto la API REST como el handshake de Socket.io.
 */
export function verifyToken(token) {
	const payload = jwt.verify(token, env.jwt.secret, {
		algorithms: [ALGORITMO],
		issuer: env.jwt.issuer,
		audience: env.jwt.audience,
	});

	// Un token sin `exp` (vencimiento) no se acepta aunque la firma sea válida.
	if (
		typeof payload !== "object" ||
		typeof payload.exp !== "number" ||
		!Number.isInteger(payload.id) ||
		payload.id <= 0 ||
		!ROLES_VALIDOS.includes(payload.rol)
	) {
		throw new jwt.JsonWebTokenError("payload inválido");
	}

	return payload;
}
