import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la fila (snake_case) de la tabla `logros`.
export function aFilaLogro(logro) {
	if (!logro) {
		return null;
	}

	return {
		id: logro.id,
		nombre: logro.nombre,
		descripcion: logro.descripcion,
		icono: logro.icono,
		condicion_tipo: logro.condicionTipo,
		condicion_valor: logro.condicionValor,
		estado: logro.estado,
		created_at: logro.createdAt,
		updated_at: logro.updatedAt,
	};
}

export async function findAllActivos() {
	const logros = await prisma.logro.findMany({
		where: { estado: "activa" },
		orderBy: { id: "asc" },
	});
	return logros.map(aFilaLogro);
}

// Todos los logros, activos e inactivos (panel de administración).
export async function findAllAdmin() {
	const logros = await prisma.logro.findMany({ orderBy: { id: "asc" } });
	return logros.map(aFilaLogro);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const logro = await prisma.logro.findUnique({ where: { id: idNormalizado } });
	return aFilaLogro(logro);
}

export async function create({ nombre, descripcion, icono, condicion_tipo, condicion_valor, estado }) {
	const logro = await prisma.logro.create({
		data: {
			nombre,
			descripcion: descripcion ?? null,
			icono: icono ?? null,
			condicionTipo: condicion_tipo,
			condicionValor: condicion_valor,
			estado: estado || "activa",
		},
	});

	return aFilaLogro(logro);
}

export async function update(id, { nombre, descripcion, icono, condicion_tipo, condicion_valor }) {
	// `undefined` significa "no tocar" y `null` significa "dejar en NULL".
	const data = {};

	if (nombre !== undefined) {
		data.nombre = nombre;
	}
	if (descripcion !== undefined) {
		data.descripcion = descripcion;
	}
	if (icono !== undefined) {
		data.icono = icono;
	}
	if (condicion_tipo !== undefined) {
		data.condicionTipo = condicion_tipo;
	}
	if (condicion_valor !== undefined) {
		data.condicionValor = condicion_valor;
	}

	if (Object.keys(data).length > 0) {
		await prisma.logro.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.logro.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

// Borra el logro; las filas de `logros_obtenidos` caen en cascada (FK ON DELETE CASCADE).
export async function remove(id) {
	await prisma.logro.deleteMany({ where: { id: Number(id) } });
}

export async function countAll() {
	return prisma.logro.count();
}

export async function countActivos() {
	return prisma.logro.count({ where: { estado: "activa" } });
}
