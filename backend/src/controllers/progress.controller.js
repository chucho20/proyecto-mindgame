import * as progresoService from "../services/progreso.service.js";
import handleError from "../utils/handleError.js";

export async function obtenerProgreso(req, res) {
	try {
		const progreso = await progresoService.consultarProgreso(req.user.id);

		return res.status(200).json(progreso);
	} catch (error) {
		return handleError(error, res);
	}
}