import * as misionService from "../services/mision.service.js";
import * as historiaService from "../services/historia.service.js";
import * as retoService from "../services/reto.service.js";
import * as actividadService from "../services/actividad.service.js";
import handleError from "../utils/handleError.js";

// --- Misiones ---

export async function listarMisiones(req, res) {
	try {
		const misiones = await misionService.listarAdmin();
		return res.status(200).json({ misiones });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function obtenerMision(req, res) {
	try {
		const mision = await misionService.obtenerAdmin(req.params.id);
		return res.status(200).json({ mision });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearMision(req, res) {
	try {
		const mision = await misionService.crear(req.body || {});
		return res.status(201).json({ mision });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarMision(req, res) {
	try {
		const mision = await misionService.actualizar(req.params.id, req.body || {});
		return res.status(200).json({ mision });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoMision(req, res) {
	try {
		const mision = await misionService.cambiarEstado(req.params.id, (req.body || {}).estado);
		return res.status(200).json({ mision });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function eliminarMision(req, res) {
	try {
		await misionService.eliminar(req.params.id);
		return res.status(204).send();
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Historias ---

export async function listarHistorias(req, res) {
	try {
		const historias = await historiaService.listarAdmin({ misionId: req.query.misionId });
		return res.status(200).json({ historias });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function obtenerHistoria(req, res) {
	try {
		const historia = await historiaService.obtenerAdmin(req.params.id);
		return res.status(200).json({ historia });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearHistoria(req, res) {
	try {
		const historia = await historiaService.crear(req.body || {});
		return res.status(201).json({ historia });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarHistoria(req, res) {
	try {
		const historia = await historiaService.actualizar(req.params.id, req.body || {});
		return res.status(200).json({ historia });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoHistoria(req, res) {
	try {
		const historia = await historiaService.cambiarEstado(req.params.id, (req.body || {}).estado);
		return res.status(200).json({ historia });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function eliminarHistoria(req, res) {
	try {
		await historiaService.eliminar(req.params.id);
		return res.status(204).send();
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Retos ---

export async function listarRetos(req, res) {
	try {
		const retos = await retoService.listarAdmin({ misionId: req.query.misionId });
		return res.status(200).json({ retos });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function obtenerReto(req, res) {
	try {
		const reto = await retoService.obtenerAdmin(req.params.id);
		return res.status(200).json({ reto });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearReto(req, res) {
	try {
		const reto = await retoService.crear(req.body || {});
		return res.status(201).json({ reto });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarReto(req, res) {
	try {
		const reto = await retoService.actualizar(req.params.id, req.body || {});
		return res.status(200).json({ reto });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoReto(req, res) {
	try {
		const reto = await retoService.cambiarEstado(req.params.id, (req.body || {}).estado);
		return res.status(200).json({ reto });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function eliminarReto(req, res) {
	try {
		await retoService.eliminar(req.params.id);
		return res.status(204).send();
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Actividades ---

export async function listarActividades(req, res) {
	try {
		const actividades = await actividadService.listarAdmin({ misionId: req.query.misionId });
		return res.status(200).json({ actividades });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function obtenerActividad(req, res) {
	try {
		const actividad = await actividadService.obtenerAdmin(req.params.id);
		return res.status(200).json({ actividad });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearActividad(req, res) {
	try {
		const actividad = await actividadService.crear(req.body || {});
		return res.status(201).json({ actividad });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarActividad(req, res) {
	try {
		const actividad = await actividadService.actualizar(req.params.id, req.body || {});
		return res.status(200).json({ actividad });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoActividad(req, res) {
	try {
		const actividad = await actividadService.cambiarEstado(req.params.id, (req.body || {}).estado);
		return res.status(200).json({ actividad });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function eliminarActividad(req, res) {
	try {
		await actividadService.eliminar(req.params.id);
		return res.status(204).send();
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Stats ---

export async function obtenerStats(req, res) {
	try {
		const stats = await misionService.obtenerStatsAdmin();
		return res.status(200).json({ stats });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}
