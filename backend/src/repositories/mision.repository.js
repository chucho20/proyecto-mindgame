import prisma from "../config/prisma.js";

export async function findAllActivas({ categoria } = {}) {
	return prisma.mision.findMany({
		where: {
			estado: "activa",
			categoria,
		},
		orderBy: [
			{
				orden: "asc",
			},
			{
				id: "asc",
			},
		],
	});
}

export async function findAllAdmin() {
	return prisma.mision.findMany({
		orderBy: [
			{
				orden: "asc",
			},
			{
				id: "asc",
			},
		],
	});
}

export async function findById(id) {
	return prisma.mision.findUnique({
		where: {
			id: Number(id),
		},
	});
}

export async function create({
	titulo,
	descripcion,
	orden,
	estado,
	categoria = "historica",
}) {
	return prisma.mision.create({
		data: {
			titulo,
			descripcion: descripcion ?? null,
			orden: orden ?? 0,
			estado: estado || "activa",
			categoria,
		},
	});
}

export async function update(
	id,
	{
		titulo,
		descripcion,
		orden,
		categoria,
	},
) {
	const data = {};

	if (titulo !== undefined) {
		data.titulo = titulo;
	}

	if (descripcion !== undefined) {
		data.descripcion = descripcion;
	}

	if (orden !== undefined) {
		data.orden = orden;
	}

	if (categoria !== undefined) {
		data.categoria = categoria;
	}

	if (Object.keys(data).length === 0) {
		return findById(id);
	}

	return prisma.mision.update({
		where: {
			id: Number(id),
		},
		data,
	});
}

export async function setEstado(id, estado) {
	return prisma.mision.update({
		where: {
			id: Number(id),
		},
		data: {
			estado,
		},
	});
}

export async function remove(id) {
	await prisma.mision.delete({
		where: {
			id: Number(id),
		},
	});
}

export async function countAll() {
	return prisma.mision.count();
}