import AppError from "../utils/AppError.js";
import { validateProfileUpdate } from "../utils/validators.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";

function sanitizeUser(usuario) {
	if (!usuario) {
		return null;
	}

	const { password_hash: _passwordHash, ...safeUser } = usuario;
	return safeUser;
}

export async function getProfile(userId) {
	const usuario = await usuarioRepository.findById(userId);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	return sanitizeUser(usuario);
}

export async function updateProfile(userId, data) {
	const errors = validateProfileUpdate(data);

	if (errors.length > 0) {
		throw new AppError("Datos de perfil inválidos.", 400, errors);
	}

	const usuario = await usuarioRepository.findById(userId);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	let edad = data.edad;
	if (edad !== undefined) {
		edad = edad === null || edad === "" ? null : Number(edad);
	}

	const updated = await usuarioRepository.update(userId, {
		nombreCompleto: data.nombreCompleto,
		edad,
		gradoCurso: data.gradoCurso,
		avatar: data.avatar,
	});

	return sanitizeUser(updated);
}
