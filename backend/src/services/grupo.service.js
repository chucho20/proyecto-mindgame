import crypto from "node:crypto";

import AppError from "../utils/AppError.js";
import { esViolacionUnica } from "../utils/dbErrors.js";
import * as grupoRepository from "../repositories/grupo.repository.js";
import * as grupoEstudianteRepository from "../repositories/grupoEstudiante.repository.js";

const LONGITUD_MAXIMA_NOMBRE = 100;
const LONGITUD_MAXIMA_CODIGO = 20;

// Código corto y fácil de dictar en clase: sin 0/O ni 1/I/L para evitar confusiones.
const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LONGITUD_CODIGO = 6;
const MAXIMO_INTENTOS_CODIGO = 5;

function generarCodigo() {
	let codigo = "";
	for (let i = 0; i < LONGITUD_CODIGO; i += 1) {
		codigo += ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)];
	}
	return codigo;
}

// Vista del grupo para su docente.
function aGrupoDeDocente(fila) {
	return {
		id: fila.id,
		nombre: fila.nombre,
		codigo: fila.codigo,
		total_estudiantes: fila.total_estudiantes ?? 0,
		created_at: fila.created_at,
		updated_at: fila.updated_at,
	};
}

// Vista del grupo para un estudiante: sin ids ni datos internos del docente.
function aGrupoDeEstudiante(fila) {
	return {
		id: fila.id,
		nombre: fila.nombre,
		codigo: fila.codigo,
		docente_nombre: fila.docente_nombre ?? null,
		...(fila.unido_en ? { unido_en: fila.unido_en } : {}),
	};
}

function validarNombre(data) {
	if (typeof data.nombre !== "string" || data.nombre.trim().length === 0) {
		return ["El nombre del grupo es obligatorio."];
	}

	if (data.nombre.trim().length > LONGITUD_MAXIMA_NOMBRE) {
		return [`El nombre del grupo no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`];
	}

	return [];
}

/**
 * Busca un grupo del docente. Un grupo ajeno y uno inexistente responden igual
 * (404), para no revelar qué grupos existen en cuentas de otros docentes.
 */
export async function obtenerGrupoPropio(docenteId, grupoId) {
	const grupo = await grupoRepository.findByIdYDocente(grupoId, docenteId);

	if (!grupo) {
		throw new AppError("Grupo no encontrado.", 404);
	}

	return grupo;
}

// --- Docente (RF-022) ---

/** Crea un grupo y le genera un código único para que los estudiantes se unan. */
export async function crearGrupo(docenteId, data) {
	const errors = validarNombre(data ?? {});

	if (errors.length > 0) {
		throw new AppError("Datos del grupo inválidos.", 400, errors);
	}

	const nombre = data.nombre.trim();

	for (let intento = 0; intento < MAXIMO_INTENTOS_CODIGO; intento += 1) {
		try {
			const grupo = await grupoRepository.create({ docenteId, nombre, codigo: generarCodigo() });
			return aGrupoDeDocente(grupo);
		} catch (error) {
			// El UNIQUE del código es la fuente de verdad: si dos grupos sortean el mismo
			// código, la base rechaza al segundo y se reintenta con otro.
			if (!esViolacionUnica(error)) {
				throw error;
			}
		}
	}

	throw new AppError("No se pudo generar un código único para el grupo. Intentá de nuevo.", 500);
}

export async function listarGruposDelDocente(docenteId) {
	const grupos = await grupoRepository.findAllByDocente(docenteId);
	return grupos.map(aGrupoDeDocente);
}

export async function obtenerGrupoDelDocente(docenteId, grupoId) {
	return aGrupoDeDocente(await obtenerGrupoPropio(docenteId, grupoId));
}

/** Estudiantes de un grupo del docente. */
export async function listarEstudiantesDelGrupo(docenteId, grupoId) {
	const grupo = await obtenerGrupoPropio(docenteId, grupoId);
	const estudiantes = await grupoEstudianteRepository.findEstudiantesByGrupo(grupo.id);

	return { grupo: aGrupoDeDocente(grupo), estudiantes };
}

/** Retira a un estudiante de un grupo del docente (no borra la cuenta del estudiante). */
export async function retirarEstudiante(docenteId, grupoId, estudianteId) {
	const grupo = await obtenerGrupoPropio(docenteId, grupoId);
	const borradas = await grupoEstudianteRepository.deleteByGrupoYEstudiante(grupo.id, estudianteId);

	if (borradas === 0) {
		throw new AppError("El estudiante no pertenece a este grupo.", 404);
	}
}

// --- Estudiante ---

/**
 * Une al estudiante a un grupo con el código que le dio su docente. Es idempotente:
 * si ya pertenecía no cambia nada y lo informa con `ya_pertenecia: true`.
 */
export async function unirseConCodigo(estudianteId, data) {
	const codigo = typeof data?.codigo === "string" ? data.codigo.trim().toUpperCase() : "";

	if (codigo.length === 0) {
		throw new AppError("Datos inválidos.", 400, ["El código del grupo es obligatorio."]);
	}

	if (codigo.length > LONGITUD_MAXIMA_CODIGO) {
		throw new AppError("No existe un grupo con ese código.", 404);
	}

	const grupo = await grupoRepository.findByCodigo(codigo);

	if (!grupo) {
		throw new AppError("No existe un grupo con ese código.", 404);
	}

	let yaPertenecia = Boolean(await grupoEstudianteRepository.findByGrupoYEstudiante(grupo.id, estudianteId));

	if (!yaPertenecia) {
		try {
			await grupoEstudianteRepository.create(grupo.id, estudianteId);
		} catch (error) {
			// Carrera entre la verificación y el INSERT (doble clic): el UNIQUE rechaza al
			// segundo y se trata como "ya pertenecía".
			if (!esViolacionUnica(error)) {
				throw error;
			}
			yaPertenecia = true;
		}
	}

	return { grupo: aGrupoDeEstudiante(grupo), ya_pertenecia: yaPertenecia };
}

export async function listarMisGrupos(estudianteId) {
	const grupos = await grupoEstudianteRepository.findGruposByEstudiante(estudianteId);
	return grupos.map(aGrupoDeEstudiante);
}

/** El estudiante abandona un grupo al que pertenece. */
export async function salirDelGrupo(estudianteId, grupoId) {
	const borradas = await grupoEstudianteRepository.deleteByGrupoYEstudiante(grupoId, estudianteId);

	if (borradas === 0) {
		throw new AppError("No pertenecés a ese grupo.", 404);
	}
}
