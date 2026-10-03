import prisma from "../config/prisma.js";

export async function findAllActivas() {
	return prisma.recompensa.findMany({
		where: {
			estado: "activa",
		},
		orderBy: {
			id: "asc",
		},
	});
}

export async function findById(id) {
	return prisma.recompensa.findUnique({
		where: {
			id: Number(id),
		},
	});
}

export async function findAllAdmin() {
	return prisma.recompensa.findMany({
		orderBy: {
			id: "asc",
		},
	});
}

export async function create({
	nombre,
	descripcion,
	icono,
	condicionTipo,
	condicionValor,
	estado = "activa",
}) {
	return prisma.recompensa.create({
		data: {
			nombre,
			descripcion,
			icono,
			condicionTipo,
			condicionValor,
			estado,
		},
	});
}

export async function update(
	id,
	{
		nombre,
		descripcion,
		icono,
		condicionTipo,
		condicionValor,
	},
) {
	const data = {};

	if (nombre !== undefined) data.nombre = nombre;
	if (descripcion !== undefined) data.descripcion = descripcion;
	if (icono !== undefined) data.icono = icono;
	if (condicionTipo !== undefined) data.condicionTipo = condicionTipo;
	if (condicionValor !== undefined) data.condicionValor = condicionValor;

	return prisma.recompensa.update({
		where: {
			id: Number(id),
		},
		data,
	});
}

export async function setEstado(id, estado) {
	return prisma.recompensa.update({
		where: {
			id: Number(id),
		},
		data: {
			estado,
		},
	});
}