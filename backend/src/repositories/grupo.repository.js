import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la fila (snake_case) de la tabla `grupos`. Cuando se consulta con el
// conteo de miembros agrega `total_estudiantes`, y cuando se consulta con el
// docente agrega `docente_nombre` (nunca otros datos del docente).
export function aFilaGrupo(grupo) {
	if (!grupo) {
		return null;
	}

	return {
		id: grupo.id,
		docente_id: grupo.docenteId,
		nombre: grupo.nombre,
		codigo: grupo.codigo,
		created_at: grupo.createdAt,
		updated_at: grupo.updatedAt,
		...(grupo._count ? { total_estudiantes: grupo._count.estudiantes } : {}),
		...(grupo.docente ? { docente_nombre: grupo.docente.nombreCompleto } : {}),
	};
}

const CONTAR_ESTUDIANTES = { _count: { select: { estudiantes: true } } };

/**
 * Crea un grupo del docente con el código ya generado. Puede lanzar un error de
 * violación UNIQUE (`P2002` en Prisma; ver `esViolacionUnica` en utils/dbErrors.js)
 * si el código ya existe — el servicio reintenta con otro código.
 */
export async function create({ docenteId, nombre, codigo }) {
	const grupo = await prisma.grupo.create({
		data: { docenteId: Number(docenteId), nombre, codigo },
		include: CONTAR_ESTUDIANTES,
	});
	return aFilaGrupo(grupo);
}

/**
 * Grupo por id SOLO si pertenece al docente indicado. Un grupo ajeno y uno
 * inexistente son indistinguibles para quien llama (devuelve `null` en ambos).
 */
export async function findByIdYDocente(id, docenteId) {
	const idNormalizado = normalizarId(id);
	const docenteIdNormalizado = normalizarId(docenteId);
	if (idNormalizado === null || docenteIdNormalizado === null) {
		return null;
	}

	const grupo = await prisma.grupo.findFirst({
		where: { id: idNormalizado, docenteId: docenteIdNormalizado },
		include: CONTAR_ESTUDIANTES,
	});
	return aFilaGrupo(grupo);
}

/** Grupos del docente, del más reciente al más antiguo, con su cantidad de estudiantes. */
export async function findAllByDocente(docenteId) {
	const docenteIdNormalizado = normalizarId(docenteId);
	if (docenteIdNormalizado === null) {
		return [];
	}

	const grupos = await prisma.grupo.findMany({
		where: { docenteId: docenteIdNormalizado },
		include: CONTAR_ESTUDIANTES,
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
	});
	return grupos.map(aFilaGrupo);
}

/**
 * Grupo por código (para que un estudiante se una), con el nombre del docente.
 * La comparación la hace MySQL con la collation de la tabla (utf8mb4_unicode_ci),
 * así que no distingue mayúsculas de minúsculas.
 */
export async function findByCodigo(codigo) {
	const grupo = await prisma.grupo.findUnique({
		where: { codigo },
		include: { docente: { select: { nombreCompleto: true } }, ...CONTAR_ESTUDIANTES },
	});
	return aFilaGrupo(grupo);
}
