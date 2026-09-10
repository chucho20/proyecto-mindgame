import * as authService from "../services/auth.service.js";
import handleError from "../utils/handleError.js";

export async function register(req, res) {
	try {
		const usuario = await authService.register(req.body || {});
		return res.status(201).json({ user: usuario });
	} catch (error) {
		return handleError(res, error, "auth.controller");
	}
}

export async function login(req, res) {
	try {
		const { correo, password } = req.body || {};
		const result = await authService.login(correo, password);
		return res.status(200).json(result);
	} catch (error) {
		return handleError(res, error, "auth.controller");
	}
}

export async function logout(_req, res) {
	// JWT sin estado en el servidor: se le indica al cliente que descarte el token.
	return res.status(200).json({ message: "Sesión cerrada correctamente." });
}

export async function forgotPassword(req, res) {
	try {
		const { correo } = req.body || {};
		const result = await authService.forgotPassword(correo);
		return res.status(200).json(result);
	} catch (error) {
		return handleError(res, error, "auth.controller");
	}
}

export async function resetPassword(req, res) {
	try {
		const { token, password } = req.body || {};
		const result = await authService.resetPassword(token, password);
		return res.status(200).json(result);
	} catch (error) {
		return handleError(res, error, "auth.controller");
	}
}
