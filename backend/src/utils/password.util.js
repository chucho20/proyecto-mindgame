import bcrypt from "bcrypt";

import env from "../config/env.js";

// Costo configurable (BCRYPT_ROUNDS, 12 por defecto). Los hashes ya guardados con otro costo siguen
// verificándose: bcrypt lee el costo desde el propio hash.
export function hashPassword(plain) {
	return bcrypt.hash(plain, env.bcryptRounds);
}

export function comparePassword(plain, hash) {
	return bcrypt.compare(plain, hash);
}
