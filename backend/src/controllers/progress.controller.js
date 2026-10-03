import * as progresoService from "../services/progreso.service.js";
import * as recompensaService from "../services/recompensa.service.js";
import * as logroService from "../services/logro.service.js";
import handleError from "../utils/handleError.js";

export async function obtenerProgreso(req, res) {
	try {
		const progreso = await progresoService.consultarProgreso(
			req.user.id,
		);

		return res.status(200).json(progreso);
	} catch (error) {
		return handleError(error, res);
	}
}

export async function listarRecompensas(req, res) {
	try {
		const recompensas =
			await recompensaService.listarObtenidasPorUsuario(
				req.user.id,
			);

		return res.status(200).json(recompensas);
	} catch (error) {
		return handleError(error, res);
	}
}

export async function listarLogros(req, res) {
	try {
		const logros =
			await logroService.listarObtenidasPorUsuario(
				req.user.id,
			);

		return res.status(200).json(logros);
	} catch (error) {
		return handleError(error, res);
	}
}