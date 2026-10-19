import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";
import { aFilaGrupo } from "./grupo.repository.js";

// Fila de `grupo_estudiantes` (snake_case).
function aFilaGrupoEstudiante(membresia) {
	if (!membresia) {
		return null;
	}

	return {
		id: membresia.id,
		grupo_id: membresia.grupoId,
		estudiante_id: membresia.estudianteId,
		created_at: membresia.createdAt,
	};
}

// Datos de un estudiante que puede ver su docente: identidad básica y progreso.
// A propósito NO incluye correo, edad ni password_hash.
function aFilaMiembro(membresia) {
	const estudiante = membresia.estudiante;

	return {
		id: estudiante.id,
		nombre_completo: estudiante.nombreCompleto,
		nombre_usuario: estudiante.nombreUsuario,
		grado_curso: estudiante.gradoCurso,
		avatar: estudiante.avatar,
		puntos_totales: estudiante.puntosTotales,
		nivel_actual: estudiante.nivelActual,
		unido_en: membresia.createdAt,
	};
}

/**
 * Asocia un estudiante a un grupo. Puede lanzar un error de violación UNIQUE
 * (`P2002` en Prisma; ver `esViolacionUnica` en utils/dbErrors.js) si ya
 * pertenecía (UNIQUE grupo_id + estudiante_id) — el servicio lo trata como
 * éxito idempotente.
 */
export async function create(grupoId, estudianteId) {
	const membresia = await prisma.grupoEstudiante.create({
		data: { grupoId: Number(grupoId), estudianteId: Number(estudianteId) },
	});
	return aFilaGrupoEstudiante(membresia);
}

export async function findByGrupoYEstudiante(grupoId, estudianteId) {
	const grupoIdNormalizado = normalizarId(grupoId);
	const estudianteIdNormalizado = normalizarId(estudianteId);
	if (grupoIdNormalizado === null || estudianteIdNormalizado === null) {
		return null;
	}

	const membresia = await prisma.grupoEstudiante.findUnique({
		where: {
			grupoId_estudianteId: { grupoId: grupoIdNormalizado, estudianteId: estudianteIdNormalizado },
		},
	});
	return aFilaGrupoEstudiante(membresia);
}

/** Estudiantes de un grupo, en el orden en que se unieron. */
export async function findEstudiantesByGrupo(grupoId) {
	const grupoIdNormalizado = normalizarId(grupoId);
	if (grupoIdNormalizado === null) {
		return [];
	}

	const membresias = await prisma.grupoEstudiante.findMany({
		where: { grupoId: grupoIdNormalizado },
		include: { estudiante: true },
		orderBy: [{ createdAt: "asc" }, { id: "asc" }],
	});
	return membresias.map(aFilaMiembro);
}

/** Quita al estudiante del grupo. Devuelve cuántas membresías se borraron (0 o 1). */
export async function deleteByGrupoYEstudiante(grupoId, estudianteId) {
	const grupoIdNormalizado = normalizarId(grupoId);
	const estudianteIdNormalizado = normalizarId(estudianteId);
	if (grupoIdNormalizado === null || estudianteIdNormalizado === null) {
		return 0;
	}

	const { count } = await prisma.grupoEstudiante.deleteMany({
		where: { grupoId: grupoIdNormalizado, estudianteId: estudianteIdNormalizado },
	});
	return count;
}

/** Grupos a los que pertenece un estudiante, con el nombre del docente, del más reciente al más antiguo. */
export async function findGruposByEstudiante(estudianteId) {
	const estudianteIdNormalizado = normalizarId(estudianteId);
	if (estudianteIdNormalizado === null) {
		return [];
	}

	const membresias = await prisma.grupoEstudiante.findMany({
		where: { estudianteId: estudianteIdNormalizado },
		include: { grupo: { include: { docente: { select: { nombreCompleto: true } } } } },
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
	});

	return membresias.map((membresia) => ({
		...aFilaGrupo(membresia.grupo),
		unido_en: membresia.createdAt,
	}));
}

/**
 * Estudiante visto por un docente: devuelve el estudiante y SOLO los grupos de ese
 * docente a los que pertenece, o `null` si no está en ninguno (estudiante ajeno o
 * inexistente son indistinguibles para quien llama).
 */
export async function findEstudianteDeDocente(estudianteId, docenteId) {
	const estudianteIdNormalizado = normalizarId(estudianteId);
	const docenteIdNormalizado = normalizarId(docenteId);
	if (estudianteIdNormalizado === null || docenteIdNormalizado === null) {
		return null;
	}

	const membresias = await prisma.grupoEstudiante.findMany({
		where: { estudianteId: estudianteIdNormalizado, grupo: { docenteId: docenteIdNormalizado } },
		include: { estudiante: true, grupo: true },
		orderBy: [{ createdAt: "asc" }, { id: "asc" }],
	});

	if (membresias.length === 0) {
		return null;
	}

	return {
		estudiante: aFilaMiembro(membresias[0]),
		grupos: membresias.map((membresia) => ({
			id: membresia.grupo.id,
			nombre: membresia.grupo.nombre,
			codigo: membresia.grupo.codigo,
		})),
	};
}
