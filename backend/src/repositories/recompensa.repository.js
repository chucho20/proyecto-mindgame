import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la fila (snake_case) de la tabla `recompensas`.
export function aFilaRecompensa(recompensa) {
	if (!recompensa) {
		return null;
	}

	return {
		id: recompensa.id,
		nombre: recompensa.nombre,
		descripcion: recompensa.descripcion,
		icono: recompensa.icono,
		condicion_tipo: recompensa.condicionTipo,
		condicion_valor: recompensa.condicionValor,
		estado: recompensa.estado,
		created_at: recompensa.createdAt,
		updated_at: recompensa.updatedAt,
	};
}

export async function findAllActivas() {
	const recompensas = await prisma.recompensa.findMany({
		where: { estado: "activa" },
		orderBy: { id: "asc" },
	});
	return recompensas.map(aFilaRecompensa);
}

// Todas las recompensas, activas e inactivas (panel de administración).
export async function findAllAdmin() {
	const recompensas = await prisma.recompensa.findMany({ orderBy: { id: "asc" } });
	return recompensas.map(aFilaRecompensa);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const recompensa = await prisma.recompensa.findUnique({ where: { id: idNormalizado } });
	return aFilaRecompensa(recompensa);
}

export async function create({ nombre, descripcion, icono, condicion_tipo, condicion_valor, estado }) {
	const recompensa = await prisma.recompensa.create({
		data: {
			nombre,
			descripcion: descripcion ?? null,
			icono: icono ?? null,
			condicionTipo: condicion_tipo,
			condicionValor: condicion_valor,
			estado: estado || "activa",
		},
	});

	return aFilaRecompensa(recompensa);
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
		await prisma.recompensa.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.recompensa.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

/**
 * Borra la recompensa solo si ningún estudiante la obtuvo. Cuenta y borra en una
 * misma transacción para no arrastrar por cascada (FK ON DELETE CASCADE) filas de
 * `recompensas_obtenidas`. Devuelve `{ eliminada, obtenidaPor }`: si `eliminada` es
 * false, `obtenidaPor` es la cantidad de estudiantes que ya la tienen.
 */
export async function removeSiNadieLaObtuvo(id) {
	return prisma.$transaction(async (tx) => {
		const obtenidaPor = await tx.recompensaObtenida.count({ where: { recompensaId: Number(id) } });

		if (obtenidaPor > 0) {
			return { eliminada: false, obtenidaPor };
		}

		await tx.recompensa.deleteMany({ where: { id: Number(id) } });
		return { eliminada: true, obtenidaPor: 0 };
	});
}

export async function countAll() {
	return prisma.recompensa.count();
}

export async function countActivas() {
	return prisma.recompensa.count({ where: { estado: "activa" } });
}
