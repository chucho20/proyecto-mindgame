import * as progresoService from "../services/progreso.service.js";
import * as recompensaService from "../services/recompensa.service.js";
import * as logroService from "../services/logro.service.js";
import handleError from "../utils/handleError.js";

export async function obtenerProgreso(req, res) {
	try {
		const progreso = await progresoService.consultarProgreso(req.user.id);
		return res.status(200).json({ progreso });
	} catch (error) {
		return handleError(res, error, "progress.controller");
	}
}

export async function listarRecompensas(req, res) {
	try {
		const { obtenidas, pendientes } = await recompensaService.listarParaEstudiante(req.user.id);
		return res.status(200).json({ obtenidas, pendientes });
	} catch (error) {
		return handleError(res, error, "progress.controller");
	}
}

export async function listarLogros(req, res) {
	try {
		const { obtenidos, pendientes } = await logroService.listarParaEstudiante(req.user.id);
		return res.status(200).json({ obtenidos, pendientes });
	} catch (error) {
		return handleError(res, error, "progress.controller");
	}
}
