import * as grupoService from "../services/grupo.service.js";
import handleError from "../utils/handleError.js";

// Módulo docente (RF-021 a RF-023). Todas las operaciones trabajan sobre los
// grupos del docente autenticado (`req.user.id`).

export async function crearGrupo(req, res) {
	try {
		const grupo = await grupoService.crearGrupo(req.user.id, req.body || {});
		return res.status(201).json({ grupo });
	} catch (error) {
		return handleError(res, error, "teacher.controller");
	}
}

export async function listarGrupos(req, res) {
	try {
		const grupos = await grupoService.listarGruposDelDocente(req.user.id);
		return res.status(200).json({ grupos });
	} catch (error) {
		return handleError(res, error, "teacher.controller");
	}
}

export async function obtenerGrupo(req, res) {
	try {
		const grupo = await grupoService.obtenerGrupoDelDocente(req.user.id, req.params.id);
		return res.status(200).json({ grupo });
	} catch (error) {
		return handleError(res, error, "teacher.controller");
	}
}

export async function listarEstudiantes(req, res) {
	try {
		const { grupo, estudiantes } = await grupoService.listarEstudiantesDelGrupo(req.user.id, req.params.id);
		return res.status(200).json({ grupo, estudiantes });
	} catch (error) {
		return handleError(res, error, "teacher.controller");
	}
}

export async function retirarEstudiante(req, res) {
	try {
		await grupoService.retirarEstudiante(req.user.id, req.params.id, req.params.estudianteId);
		return res.status(200).json({ message: "Estudiante retirado del grupo." });
	} catch (error) {
		return handleError(res, error, "teacher.controller");
	}
}
