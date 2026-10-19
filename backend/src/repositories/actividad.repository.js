import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
// `mision_id` puede ser null (una actividad puede no estar asociada a misión).
function aFilaActividad(actividad) {
	if (!actividad) {
		return null;
	}

	return {
		id: actividad.id,
		mision_id: actividad.misionId,
		titulo: actividad.titulo,
		descripcion: actividad.descripcion,
		tipo: actividad.tipo,
		orden: actividad.orden,
		estado: actividad.estado,
		created_at: actividad.createdAt,
		updated_at: actividad.updatedAt,
		retroalimentacion: actividad.retroalimentacion,
		puntos: actividad.puntos,
	};
}

const ORDEN_POR_DEFECTO = [{ orden: "asc" }, { id: "asc" }];

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	const misionIdNormalizado = normalizarId(misionId);
	if (misionIdNormalizado === null) {
		return [];
	}

	const actividades = await prisma.actividad.findMany({
		where: { misionId: misionIdNormalizado, ...(onlyActive ? { estado: "activa" } : {}) },
		orderBy: ORDEN_POR_DEFECTO,
	});
	return actividades.map(aFilaActividad);
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		const misionIdNormalizado = normalizarId(misionId);
		if (misionIdNormalizado === null) {
			return [];
		}

		const actividades = await prisma.actividad.findMany({
			where: { misionId: misionIdNormalizado },
			orderBy: ORDEN_POR_DEFECTO,
		});
		return actividades.map(aFilaActividad);
	}

	// En MySQL los NULL van primero con ORDER BY ... ASC, igual que antes
	// (las actividades sin misión aparecen al comienzo).
	const actividades = await prisma.actividad.findMany({
		orderBy: [{ misionId: "asc" }, ...ORDEN_POR_DEFECTO],
	});
	return actividades.map(aFilaActividad);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const actividad = await prisma.actividad.findUnique({ where: { id: idNormalizado } });
	return aFilaActividad(actividad);
}

export async function create({
	misionId,
	titulo,
	descripcion,
	tipo,
	orden,
	estado,
	puntos,
	retroalimentacion,
}) {
	const actividad = await prisma.actividad.create({
		data: {
			// OJO: `Number(null)` es 0, que violaría la FK; null se conserva como null.
			misionId: misionId === null || misionId === undefined ? null : Number(misionId),
			titulo,
			descripcion: descripcion ?? null,
			tipo,
			orden: orden ?? 0,
			estado: estado || "activa",
			puntos: puntos ?? 0,
			retroalimentacion: retroalimentacion ?? null,
		},
	});

	return aFilaActividad(actividad);
}

export async function update(id, { titulo, descripcion, tipo, orden, puntos, retroalimentacion }) {
	// `undefined` significa "no tocar" y `null` significa "dejar en NULL".
	const data = {};

	if (titulo !== undefined) {
		data.titulo = titulo;
	}
	if (descripcion !== undefined) {
		data.descripcion = descripcion;
	}
	if (tipo !== undefined) {
		data.tipo = tipo;
	}
	if (orden !== undefined) {
		data.orden = orden;
	}
	if (puntos !== undefined) {
		data.puntos = puntos;
	}
	if (retroalimentacion !== undefined) {
		data.retroalimentacion = retroalimentacion;
	}

	if (Object.keys(data).length > 0) {
		await prisma.actividad.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.actividad.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

export async function remove(id) {
	await prisma.actividad.deleteMany({ where: { id: Number(id) } });
}

export async function countAll() {
	return prisma.actividad.count();
}

export async function countByMisionId(misionId, { onlyActive = false } = {}) {
	const misionIdNormalizado = normalizarId(misionId);
	if (misionIdNormalizado === null) {
		return 0;
	}

	return prisma.actividad.count({
		where: { misionId: misionIdNormalizado, ...(onlyActive ? { estado: "activa" } : {}) },
	});
}
