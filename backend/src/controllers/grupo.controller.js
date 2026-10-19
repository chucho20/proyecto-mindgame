import * as grupoService from "../services/grupo.service.js";
import handleError from "../utils/handleError.js";

// Grupos desde el lado del estudiante: unirse con el código del docente,
// listar sus grupos y abandonar uno.

export async function unirse(req, res) {
	try {
		const { grupo, ya_pertenecia: yaPertenecia } = await grupoService.unirseConCodigo(
			req.user.id,
			req.body || {},
		);
		// 201 si se unió ahora; 200 si ya pertenecía (la operación es idempotente).
		return res.status(yaPertenecia ? 200 : 201).json({ grupo, ya_pertenecia: yaPertenecia });
	} catch (error) {
		return handleError(res, error, "grupo.controller");
	}
}

export async function listarMios(req, res) {
	try {
		const grupos = await grupoService.listarMisGrupos(req.user.id);
		return res.status(200).json({ grupos });
	} catch (error) {
		return handleError(res, error, "grupo.controller");
	}
}

export async function salir(req, res) {
	try {
		await grupoService.salirDelGrupo(req.user.id, req.params.id);
		return res.status(200).json({ message: "Saliste del grupo." });
	} catch (error) {
		return handleError(res, error, "grupo.controller");
	}
}
