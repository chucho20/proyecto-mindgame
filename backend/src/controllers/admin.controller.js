import * as misionService from "../services/mision.service.js";
import * as historiaService from "../services/historia.service.js";
import * as retoService from "../services/reto.service.js";
import * as actividadService from "../services/actividad.service.js";
import * as recompensaService from "../services/recompensa.service.js";
import * as logroService from "../services/logro.service.js";
import * as mensajePositivoService from "../services/mensajePositivo.service.js";

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
		const mision = await misionService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ mision });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoMision(req, res) {
	try {
		const mision = await misionService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
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
		const historias = await historiaService.listarAdmin({
			misionId: req.query.misionId,
		});
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
		const historia = await historiaService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ historia });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoHistoria(req, res) {
	try {
		const historia = await historiaService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
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
		const retos = await retoService.listarAdmin({
			misionId: req.query.misionId,
		});
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
		const reto = await retoService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ reto });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoReto(req, res) {
	try {
		const reto = await retoService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
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
		const actividades = await actividadService.listarAdmin({
			misionId: req.query.misionId,
		});
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
		const actividad = await actividadService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ actividad });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoActividad(req, res) {
	try {
		const actividad = await actividadService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
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

// --- Recompensas ---

export async function listarRecompensas(req, res) {
	try {
		const recompensas = await recompensaService.listarAdmin();
		return res.status(200).json({ recompensas });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearRecompensa(req, res) {
	try {
		const recompensa = await recompensaService.crear(req.body || {});
		return res.status(201).json({ recompensa });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarRecompensa(req, res) {
	try {
		const recompensa = await recompensaService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ recompensa });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoRecompensa(req, res) {
	try {
		const recompensa = await recompensaService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
		return res.status(200).json({ recompensa });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Logros ---

export async function listarLogros(req, res) {
	try {
		const logros = await logroService.listarAdmin();
		return res.status(200).json({ logros });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearLogro(req, res) {
	try {
		const logro = await logroService.crear(req.body || {});
		return res.status(201).json({ logro });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarLogro(req, res) {
	try {
		const logro = await logroService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ logro });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoLogro(req, res) {
	try {
		const logro = await logroService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
		return res.status(200).json({ logro });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Mensajes positivos ---

export async function listarMensajesPositivos(req, res) {
	try {
		const mensajes = await mensajePositivoService.listarAdmin();
		return res.status(200).json({ mensajes });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function crearMensajePositivo(req, res) {
	try {
		const mensaje = await mensajePositivoService.crear(req.body || {});
		return res.status(201).json({ mensaje });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function actualizarMensajePositivo(req, res) {
	try {
		const mensaje = await mensajePositivoService.actualizar(
			req.params.id,
			req.body || {},
		);
		return res.status(200).json({ mensaje });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

export async function cambiarEstadoMensajePositivo(req, res) {
	try {
		const mensaje = await mensajePositivoService.cambiarEstado(
			req.params.id,
			(req.body || {}).estado,
		);
		return res.status(200).json({ mensaje });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}

// --- Stats ---

export async function obtenerStats(req, res) {
	try {
		const statsBase = await misionService.obtenerStatsAdmin();

		const recompensas = await recompensaService.listarAdmin();
		const logros = await logroService.listarAdmin();

		const stats = {
			...statsBase,
			recompensasActivas: recompensas.filter(
				(recompensa) => recompensa.estado === "activa",
			).length,
			logrosActivos: logros.filter(
				(logro) => logro.estado === "activa",
			).length,
		};

		return res.status(200).json({ stats });
	} catch (error) {
		return handleError(res, error, "admin.controller");
	}
}