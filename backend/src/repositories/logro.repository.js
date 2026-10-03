import prisma from "../config/prisma.js";

export async function findAllActivos() {
	return prisma.logro.findMany({
		where: {
			estado: "activa",
		},
		orderBy: {
			id: "asc",
		},
	});
}

export async function findById(id) {
	return prisma.logro.findUnique({
		where: {
			id: Number(id),
		},
	});
}

export async function findAllAdmin() {
	return prisma.logro.findMany({
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
	return prisma.logro.create({
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

	return prisma.logro.update({
		where: {
			id: Number(id),
		},
		data,
	});
}

export async function setEstado(id, estado) {
	return prisma.logro.update({
		where: {
			id: Number(id),
		},
		data: {
			estado,
		},
	});
}