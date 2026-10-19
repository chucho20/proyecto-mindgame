import prisma from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.ts";
import { normalizarId } from "../utils/dbIds.js";

// Nota: las columnas `opciones` y `respuesta_correcta` son tipo JSON nativo
// de MySQL y Prisma las entrega ya parseadas (objeto/arreglo/booleano/string
// primitivo), igual que mysql2. Por eso el mapper las deja pasar SIN tocarlas:
// no hay que hacer JSON.parse/JSON.stringify manual, y un valor correcto que
// sea un string primitivo (ej. seleccion_multiple con respuesta_correcta = "a")
// llega como "a", no como texto JSON crudo.

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaReto(reto) {
	if (!reto) {
		return null;
	}

	return {
		id: reto.id,
		mision_id: reto.misionId,
		tipo: reto.tipo,
		enunciado: reto.enunciado,
		opciones: reto.opciones,
		respuesta_correcta: reto.respuestaCorrecta,
		puntos: reto.puntos,
		orden: reto.orden,
		estado: reto.estado,
		created_at: reto.createdAt,
		updated_at: reto.updatedAt,
		retroalimentacion: reto.retroalimentacion,
	};
}

// En una columna JSON, Prisma distingue el NULL de SQL (`DbNull`) del valor
// JSON `null` (`JsonNull`); un `null` de JS hay que traducirlo a uno de los dos.
function aJsonPrisma(valor) {
	return valor === null ? Prisma.JsonNull : valor;
}

const ORDEN_POR_DEFECTO = [{ orden: "asc" }, { id: "asc" }];

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	const misionIdNormalizado = normalizarId(misionId);
	if (misionIdNormalizado === null) {
		return [];
	}

	const retos = await prisma.reto.findMany({
		where: { misionId: misionIdNormalizado, ...(onlyActive ? { estado: "activo" } : {}) },
		orderBy: ORDEN_POR_DEFECTO,
	});
	return retos.map(aFilaReto);
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		const misionIdNormalizado = normalizarId(misionId);
		if (misionIdNormalizado === null) {
			return [];
		}

		const retos = await prisma.reto.findMany({
			where: { misionId: misionIdNormalizado },
			orderBy: ORDEN_POR_DEFECTO,
		});
		return retos.map(aFilaReto);
	}

	const retos = await prisma.reto.findMany({ orderBy: [{ misionId: "asc" }, ...ORDEN_POR_DEFECTO] });
	return retos.map(aFilaReto);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const reto = await prisma.reto.findUnique({ where: { id: idNormalizado } });
	return aFilaReto(reto);
}

export async function create({
	misionId,
	tipo,
	enunciado,
	opciones,
	respuestaCorrecta,
	puntos,
	orden,
	estado,
	retroalimentacion,
}) {
	const reto = await prisma.reto.create({
		data: {
			misionId: Number(misionId),
			tipo,
			enunciado,
			// `undefined` -> NULL de SQL; `null` explícito -> JSON `null` (igual que
			// hacía `JSON.stringify(null)` en la versión mysql2).
			opciones: opciones === undefined ? Prisma.DbNull : aJsonPrisma(opciones),
			respuestaCorrecta: aJsonPrisma(respuestaCorrecta),
			puntos: puntos ?? 10,
			orden: orden ?? 0,
			estado: estado || "activo",
			retroalimentacion: retroalimentacion ?? null,
		},
	});

	return aFilaReto(reto);
}

export async function update(
	id,
	{ tipo, enunciado, opciones, respuestaCorrecta, puntos, orden, retroalimentacion },
) {
	// `undefined` significa "no tocar".
	const data = {};

	if (tipo !== undefined) {
		data.tipo = tipo;
	}
	if (enunciado !== undefined) {
		data.enunciado = enunciado;
	}
	if (opciones !== undefined) {
		data.opciones = aJsonPrisma(opciones);
	}
	if (respuestaCorrecta !== undefined) {
		data.respuestaCorrecta = aJsonPrisma(respuestaCorrecta);
	}
	if (puntos !== undefined) {
		data.puntos = puntos;
	}
	if (orden !== undefined) {
		data.orden = orden;
	}
	if (retroalimentacion !== undefined) {
		data.retroalimentacion = retroalimentacion;
	}

	if (Object.keys(data).length > 0) {
		await prisma.reto.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function setEstado(id, estado) {
	await prisma.reto.updateMany({ where: { id: Number(id) }, data: { estado } });
	return findById(id);
}

export async function remove(id) {
	await prisma.reto.deleteMany({ where: { id: Number(id) } });
}

export async function countAll() {
	return prisma.reto.count();
}

export async function countByMisionId(misionId, { onlyActive = false } = {}) {
	const misionIdNormalizado = normalizarId(misionId);
	if (misionIdNormalizado === null) {
		return 0;
	}

	return prisma.reto.count({
		where: { misionId: misionIdNormalizado, ...(onlyActive ? { estado: "activo" } : {}) },
	});
}
