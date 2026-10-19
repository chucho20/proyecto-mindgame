import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaHistoria(historia) {
	if (!historia) {
		return null;
	}

	return {
		id: historia.id,
		mision_id: historia.misionId,
		titulo: historia.titulo,
		contenido: historia.contenido,
		orden: historia.orden,
		estado: historia.estado,
		created_at: historia.createdAt,
		updated_at: historia.updatedAt,
	};
}

const ORDEN_POR_DEFECTO = [{ orden: "asc" }, { id: "asc" }];

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	const misionIdNormalizado = normalizarId(misionId);
	if (misionIdNormalizado === null) {
		return [];
	}

	const historias = await prisma.historia.findMany({
		where: { misionId: misionIdNormalizado, ...(onlyActive ? { estado: "activa" } : {}) },
		orderBy: ORDEN_POR_DEFECTO,
	});
	return historias.map(aFilaHistoria);
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		const misionIdNormalizado = normalizarId(misionId);
		if (misionIdNormalizado === null) {
			return [];
		}

		const historias = await prisma.historia.findMany({
			where: { misionId: misionIdNormalizado },
			orderBy: ORDEN_POR_DEFECTO,
		});
		return historias.map(aFilaHistoria);
	}

	const historias = await prisma.historia.findMany({
		orderBy: [{ misionId: "asc" }, ...ORDEN_POR_DEFECTO],
	});
	return historias.map(aFilaHistoria);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const historia = await prisma.historia.findUnique({ where: { id: idNormalizado } });
	return aFilaHistoria(historia);
}

export async function create({ misionId, titulo, contenido, orden, estado }) {
	const historia = await prisma.historia.create({
		data: {
			misionId: Number(misionId),
			titulo,
			contenido,
			orden: orden ?? 0,
			estado: estado || "activa",
		},
	});

	return aFilaHistoria(historia);
}

export async function update(id, { titulo, contenido, orden }) {
	// `undefined` significa "no tocar".
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

	if (Object.keys(data).length > 0) {
		await prisma.historia.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.historia.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

export async function remove(id) {
	await prisma.historia.deleteMany({ where: { id: Number(id) } });
}

export async function countAll() {
	return prisma.historia.count();
}
