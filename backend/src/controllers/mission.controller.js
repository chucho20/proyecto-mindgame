import * as misionService from "../services/mision.service.js";
import * as historiaService from "../services/historia.service.js";
import * as retoService from "../services/reto.service.js";
import * as actividadService from "../services/actividad.service.js";
import handleError from "../utils/handleError.js";

export async function listarMisiones(req, res) {
	try {
		const misiones = await misionService.listar(req.user.id);
		return res.status(200).json({ misiones });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function obtenerMision(req, res) {
	try {
		const mision = await misionService.obtener(req.params.id, req.user.id);
		return res.status(200).json({ mision });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function iniciarMision(req, res) {
	try {
		const progreso = await misionService.iniciar(req.params.id, req.user.id);
		return res.status(200).json({ progreso });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function listarHistorias(req, res) {
	try {
		const historias = await historiaService.listarPorMision(req.params.id, req.user.id);
		return res.status(200).json({ historias });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function completarHistoria(req, res) {
	try {
		const resultado = await historiaService.marcarCompletada(req.params.id, req.user.id);
		return res.status(200).json(resultado);
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function listarRetos(req, res) {
	try {
		const retos = await retoService.listarPorMision(req.params.id);
		return res.status(200).json({ retos });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function responderReto(req, res) {
	try {
		const { respuesta } = req.body || {};
		const resultado = await retoService.responder(req.params.id, req.user.id, respuesta);
		return res.status(200).json({ resultado });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function listarActividades(req, res) {
	try {
		const actividades = await actividadService.listar(req.params.id, req.user.id);
		return res.status(200).json({ actividades });
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}

export async function completarActividad(req, res) {
	try {
		const resultado = await actividadService.completar(req.params.id, req.user.id);
		return res.status(200).json(resultado);
	} catch (error) {
		return handleError(res, error, "mission.controller");
	}
}
