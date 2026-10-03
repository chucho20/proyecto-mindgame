import prisma from "../config/prisma.js";

export async function findAllActivos() {
	return prisma.mensajePositivo.findMany({
		where: {
			estado: "activa",
		},
		orderBy: {
			id: "asc",
		},
	});
}

export async function findByContexto(contexto) {
	return prisma.mensajePositivo.findMany({
		where: {
			contexto,
			estado: "activa",
		},
		orderBy: {
			id: "asc",
		},
	});
}

export async function findAllAdmin() {
	return prisma.mensajePositivo.findMany({
		orderBy: {
			id: "asc",
		},
	});
}

export async function findById(id) {
	return prisma.mensajePositivo.findUnique({
		where: {
			id: Number(id),
		},
	});
}

export async function create({
	contenido,
	contexto,
	estado = "activa",
}) {
	return prisma.mensajePositivo.create({
		data: {
			contenido,
			contexto,
			estado,
		},
	});
}

export async function update(
	id,
	{
		contenido,
		contexto,
	},
) {
	const data = {};

	if (contenido !== undefined) data.contenido = contenido;
	if (contexto !== undefined) data.contexto = contexto;

	return prisma.mensajePositivo.update({
		where: {
			id: Number(id),
		},
		data,
	});
}

export async function setEstado(id, estado) {
	return prisma.mensajePositivo.update({
		where: {
			id: Number(id),
		},
		data: {
			estado,
		},
	});
}