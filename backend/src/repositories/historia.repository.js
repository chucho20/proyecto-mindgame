import prisma from "../config/prisma.js";

export async function findByMisionId(
	misionId,
	{ onlyActive = false } = {},
) {
	return prisma.historia.findMany({
		where: {
			misionId: Number(misionId),
			estado: onlyActive ? "activa" : undefined,
		},
		orderBy: [
			{ orden: "asc" },
			{ id: "asc" },
		],
	});
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		return prisma.historia.findMany({
			where: {
				misionId: Number(misionId),
			},
			orderBy: [
				{ orden: "asc" },
				{ id: "asc" },
			],
		});
	}

	return prisma.historia.findMany({
		orderBy: [
			{ misionId: "asc" },
			{ orden: "asc" },
			{ id: "asc" },
		],
	});
}

export async function findById(id) {
	return prisma.historia.findUnique({
		where: {
			id: Number(id),
		},
	});
}

export async function create({
	misionId,
	titulo,
	contenido,
	orden,
	estado,
}) {
	return prisma.historia.create({
		data: {
			misionId: Number(misionId),
			titulo,
			contenido,
			orden: orden ?? 0,
			estado: estado || "activa",
		},
	});
}

export async function update(id, { titulo, contenido, orden }) {
	const data = {};

	if (titulo !== undefined) {
		data.titulo = titulo;
	}

	if (contenido !== undefined) {
		data.contenido = contenido;
	}

	if (orden !== undefined) {
		data.orden = orden;
	}

	if (Object.keys(data).length === 0) {
		return findById(id);
	}

	return prisma.historia.update({
		where: {
			id: Number(id),
		},
		data,
	});
}

export async function setEstado(id, estado) {
	return prisma.historia.update({
		where: {
			id: Number(id),
		},
		data: {
			estado,
		},
	});
}

export async function remove(id) {
	await prisma.historia.delete({
		where: {
			id: Number(id),
		},
	});
}

export async function countAll() {
	return prisma.historia.count();
}