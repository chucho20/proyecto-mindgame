
import prisma from "../config/prisma.js";

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	return prisma.actividad.findMany({
		where: {
			misionId,
			...(onlyActive ? { estado: "activa" } : {}),
		},
		orderBy: [{ orden: "asc" }, { id: "asc" }],
	});
}

export async function findById(id) {
	return prisma.actividad.findUnique({
		where: { id },
	});
}

export async function findAllAdmin({ misionId } = {}) {
	return prisma.actividad.findMany({
		where: misionId ? { misionId } : undefined,
		orderBy: misionId
			? [{ orden: "asc" }, { id: "asc" }]
			: [{ misionId: "asc" }, { orden: "asc" }, { id: "asc" }],
	});
}

export async function create({
	misionId,
	titulo,
	descripcion,
	tipo,
	orden,
	estado,
}) {
	return prisma.actividad.create({
		data: {
			misionId: misionId ?? null,
			titulo,
			descripcion: descripcion ?? null,
			tipo,
			orden: orden ?? 0,
			estado: estado || "activa",
		},
	});
}

export async function update(
	id,
	{ titulo, descripcion, tipo, orden },
) {
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

	if (Object.keys(data).length === 0) {
		return findById(id);
	}

	return prisma.actividad.update({
		where: { id },
		data,
	});
}

export async function setEstado(id, estado) {
	return prisma.actividad.update({
		where: { id },
		data: { estado },
	});
}

export async function remove(id) {
	await prisma.actividad.delete({
		where: { id },
	});
}

export async function countByMisionId(
	misionId,
	{ onlyActive = false } = {},
) {
	return prisma.actividad.count({
		where: {
			misionId,
			...(onlyActive ? { estado: "activa" } : {}),
		},
	});
}

