import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la fila (snake_case) de la tabla `mensajes_positivos`.
function aFilaMensajePositivo(mensaje) {
	if (!mensaje) {
		return null;
	}

	return {
		id: mensaje.id,
		contenido: mensaje.contenido,
		contexto: mensaje.contexto,
		estado: mensaje.estado,
		created_at: mensaje.createdAt,
		updated_at: mensaje.updatedAt,
	};
}

/**
 * Mensajes ACTIVOS de un contexto. La comparación la hace MySQL con la collation de
 * la tabla (utf8mb4_unicode_ci), así que no distingue mayúsculas de minúsculas.
 */
export async function findActivosByContexto(contexto) {
	const mensajes = await prisma.mensajePositivo.findMany({
		where: { contexto, estado: "activa" },
		orderBy: { id: "asc" },
	});
	return mensajes.map(aFilaMensajePositivo);
}

export async function findAllAdmin() {
	const mensajes = await prisma.mensajePositivo.findMany({ orderBy: { id: "asc" } });
	return mensajes.map(aFilaMensajePositivo);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const mensaje = await prisma.mensajePositivo.findUnique({ where: { id: idNormalizado } });
	return aFilaMensajePositivo(mensaje);
}

export async function create({ contenido, contexto, estado }) {
	const mensaje = await prisma.mensajePositivo.create({
		data: { contenido, contexto, estado: estado || "activa" },
	});

	return aFilaMensajePositivo(mensaje);
}

export async function update(id, { contenido, contexto }) {
	// `undefined` significa "no tocar".
	const data = {};

	if (contenido !== undefined) {
		data.contenido = contenido;
	}
	if (contexto !== undefined) {
		data.contexto = contexto;
	}

	if (Object.keys(data).length > 0) {
		await prisma.mensajePositivo.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.mensajePositivo.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

export async function remove(id) {
	await prisma.mensajePositivo.deleteMany({ where: { id: Number(id) } });
}
