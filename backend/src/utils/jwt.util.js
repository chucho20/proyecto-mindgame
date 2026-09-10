import jwt from "jsonwebtoken";

import env from "../config/env.js";

export function signToken({ id, rol }) {
	return jwt.sign({ id, rol }, env.jwt.secret, {
		expiresIn: env.jwt.expiresIn,
	});
}

export function verifyToken(token) {
	return jwt.verify(token, env.jwt.secret);
}
