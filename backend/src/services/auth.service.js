import crypto from "node:crypto";

import env from "../config/env.js";
import AppError from "../utils/AppError.js";
import {
	validateForgotPassword,
	validateLogin,
	validateRegister,
	validateResetPassword,
} from "../utils/validators.js";
import { comparePassword, hashPassword } from "../utils/password.util.js";
import { signToken } from "../utils/jwt.util.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";
import * as passwordResetRepository from "../repositories/passwordReset.repository.js";
import { sendPasswordResetEmail } from "./mail.service.js";

function sanitizeUser(usuario) {
	if (!usuario) {
		return null;
	}

	const { password_hash: _passwordHash, ...safeUser } = usuario;
	return safeUser;
}

function hashToken(token) {
	return crypto.createHash("sha256").update(token).digest("hex");
}

// Hash de referencia para comparar contra una cuenta inexistente y así no filtrar
// por tiempo de respuesta si el correo está o no registrado (RF-002).
let dummyHashPromise;
function getDummyHash() {
	if (!dummyHashPromise) {
		dummyHashPromise = hashPassword(crypto.randomBytes(32).toString("hex"));
	}
	return dummyHashPromise;
}

export async function register(data) {
	const errors = validateRegister(data);

	if (errors.length > 0) {
		throw new AppError("Datos de registro inválidos.", 400, errors);
	}

	const correo = data.correo.trim().toLowerCase();
	const nombreUsuario = data.nombreUsuario.trim();

	const existingByEmail = await usuarioRepository.findByEmail(correo);
	if (existingByEmail) {
		throw new AppError("Ya existe una cuenta registrada con ese correo.", 409);
	}

	const existingByUsername = await usuarioRepository.findByUsername(nombreUsuario);
	if (existingByUsername) {
		throw new AppError("Ese nombre de usuario ya está en uso.", 409);
	}

	const passwordHash = await hashPassword(data.password);

	let usuario;
	try {
		usuario = await usuarioRepository.create({
			nombreCompleto: data.nombreCompleto.trim(),
			correo,
			nombreUsuario,
			passwordHash,
			edad: data.edad ? Number(data.edad) : null,
			gradoCurso: data.gradoCurso || null,
			rol: data.rol,
			avatar: data.avatar || null,
			aceptaTratamientoDatos: true,
		});
	} catch (error) {
		// Cubre la carrera entre la verificación previa y el INSERT: si dos
		// registros concurrentes usan el mismo correo/usuario, el UNIQUE de la
		// base de datos rechaza al segundo — lo mapeamos a 409, no a un 500 genérico.
		if (error && error.code === "ER_DUP_ENTRY") {
			throw new AppError("Ya existe una cuenta registrada con ese correo o nombre de usuario.", 409);
		}
		throw error;
	}

	return sanitizeUser(usuario);
}

export async function login(correo, password) {
	const errors = validateLogin({ correo, password });

	if (errors.length > 0) {
		throw new AppError("Datos de inicio de sesión inválidos.", 400, errors);
	}

	const usuario = await usuarioRepository.findByEmail(correo.trim().toLowerCase());

	// Mensaje genérico: no revela si falló el correo o la contraseña (RF-002).
	const invalidCredentialsError = new AppError("Correo o contraseña incorrectos.", 401);

	// Comparamos siempre contra un hash (real o de referencia) para que el tiempo
	// de respuesta no delate si la cuenta existe.
	const passwordHash = usuario ? usuario.password_hash : await getDummyHash();
	const passwordMatches = await comparePassword(password, passwordHash);

	if (!usuario || !passwordMatches) {
		throw invalidCredentialsError;
	}

	const token = signToken({ id: usuario.id, rol: usuario.rol });

	return { token, user: sanitizeUser(usuario) };
}

export async function forgotPassword(correo) {
	const errors = validateForgotPassword({ correo });

	if (errors.length > 0) {
		throw new AppError("Datos inválidos.", 400, errors);
	}

	const usuario = await usuarioRepository.findByEmail(correo.trim().toLowerCase());

	// No confirmamos ni negamos la existencia de la cuenta (RF-003).
	if (usuario) {
		const plainToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = hashToken(plainToken);
		const expiraEn = new Date(Date.now() + env.resetTokenExpiresMin * 60 * 1000);

		await passwordResetRepository.create({
			usuarioId: usuario.id,
			tokenHash,
			expiraEn,
		});

		const resetLink = `${env.frontendUrl}/reset-password/${plainToken}`;

		// No esperamos el envío del correo: el tiempo de red del SMTP no debe
		// filtrar si la cuenta existe (RF-003). Los errores de envío solo se logean.
		sendPasswordResetEmail(usuario.correo, resetLink).catch((error) => {
			console.error("Error enviando correo de restablecimiento:", error);
		});
	}

	return {
		message:
			"Si el correo existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.",
	};
}

export async function resetPassword(token, newPassword) {
	const errors = validateResetPassword({ token, password: newPassword });

	if (errors.length > 0) {
		throw new AppError("Datos inválidos.", 400, errors);
	}

	const tokenHash = hashToken(token);
	const resetRecord = await passwordResetRepository.findValidByTokenHash(tokenHash);

	if (!resetRecord) {
		throw new AppError("El enlace de restablecimiento es inválido o expiró.", 400);
	}

	const passwordHash = await hashPassword(newPassword);

	await usuarioRepository.updatePassword(resetRecord.usuario_id, passwordHash);
	await passwordResetRepository.markAsUsed(resetRecord.id);

	return { message: "Contraseña restablecida correctamente." };
}
