import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaMision(mision) {
	if (!mision) {
		return null;
	}

	return {
		id: mision.id,
		titulo: mision.titulo,
		descripcion: mision.descripcion,
		orden: mision.orden,
		estado: mision.estado,
		created_at: mision.createdAt,
		updated_at: mision.updatedAt,
		categoria: mision.categoria,
	};
}

const ORDEN_POR_DEFECTO = [{ orden: "asc" }, { id: "asc" }];

export async function findAllActivas({ categoria } = {}) {
	const misiones = await prisma.mision.findMany({
		where: { estado: "activa", ...(categoria ? { categoria } : {}) },
		orderBy: ORDEN_POR_DEFECTO,
	});
	return misiones.map(aFilaMision);
}

export async function findAllAdmin() {
	const misiones = await prisma.mision.findMany({ orderBy: ORDEN_POR_DEFECTO });
	return misiones.map(aFilaMision);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const mision = await prisma.mision.findUnique({ where: { id: idNormalizado } });
	return aFilaMision(mision);
}

export async function create({ titulo, descripcion, orden, estado, categoria }) {
	const mision = await prisma.mision.create({
		data: {
			titulo,
			descripcion: descripcion ?? null,
			orden: orden ?? 0,
			estado: estado || "activa",
			categoria: categoria || "historica",
		},
	});

	return aFilaMision(mision);
}

export async function update(id, { titulo, descripcion, orden, categoria }) {
	// `undefined` significa "no tocar" y `null` significa "dejar en NULL".
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

	if (Object.keys(data).length > 0) {
		await prisma.mision.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.mision.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

export async function remove(id) {
	await prisma.mision.deleteMany({ where: { id: Number(id) } });
}

export async function countAll() {
	return prisma.mision.count();
}
