import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

const ESTADOS_ABIERTOS = ["esperando", "en_curso"];

// Devuelve la fila (snake_case) de la tabla `salas`.
export function aFilaSala(sala) {
	if (!sala) {
		return null;
	}

	return {
		id: sala.id,
		codigo: sala.codigo,
		actividad_id: sala.actividadId,
		grupo_id: sala.grupoId,
		docente_id: sala.docenteId,
		estado: sala.estado,
		capacidad_minima: sala.capacidadMinima,
		iniciada_en: sala.iniciadaEn,
		finalizada_en: sala.finalizadaEn,
		created_at: sala.createdAt,
		updated_at: sala.updatedAt,
	};
}

/**
 * Crea la sala en estado `esperando` con su código ya generado. Puede lanzar un error de
 * violación UNIQUE (`P2002`; ver `esViolacionUnica` en utils/dbErrors.js) si el código ya
 * existe — el servicio reintenta con otro código.
 */
export async function create({ codigo, actividadId, grupoId, docenteId, capacidadMinima }) {
	const sala = await prisma.sala.create({
		data: {
			codigo,
			actividadId: Number(actividadId),
			grupoId: Number(grupoId),
			docenteId: Number(docenteId),
			capacidadMinima: Number(capacidadMinima),
		},
	});
	return aFilaSala(sala);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	return aFilaSala(await prisma.sala.findUnique({ where: { id: idNormalizado } }));
}

export async function findByCodigo(codigo) {
	return aFilaSala(await prisma.sala.findUnique({ where: { codigo } }));
}

/**
 * Pasa la sala de `esperando` a `en_curso`. La condición en el WHERE hace de candado:
 * devuelve 1 si esta llamada hizo la transición y 0 si la sala ya no estaba esperando.
 */
export async function marcarIniciada(id, iniciadaEn) {
	const { count } = await prisma.sala.updateMany({
		where: { id: Number(id), estado: "esperando" },
		data: { estado: "en_curso", iniciadaEn },
	});
	return count;
}

/** Cierra (cancela) una sala abierta. Devuelve 1 si la cerró y 0 si ya estaba finalizada o cerrada. */
export async function cerrar(id) {
	const { count } = await prisma.sala.updateMany({
		where: { id: Number(id), estado: { in: ESTADOS_ABIERTOS } },
		data: { estado: "cerrada" },
	});
	return count;
}

/**
 * Cierra todas las salas que quedaron abiertas: las salas viven en memoria del proceso, así que
 * al arrancar las que figuran abiertas son huérfanas de una ejecución anterior.
 */
export async function cerrarAbiertas() {
	const { count } = await prisma.sala.updateMany({
		where: { estado: { in: ESTADOS_ABIERTOS } },
		data: { estado: "cerrada" },
	});
	return count;
}

/**
 * Finaliza la sala y registra las participaciones en UNA transacción. Devuelve `false` (sin
 * escribir nada) si la sala ya no estaba `en_curso`; así dos "finalizar" simultáneos nunca
 * duplican filas. `skipDuplicates` + UNIQUE (sala_id, usuario_id) son el segundo seguro.
 */
export async function finalizarConParticipaciones(id, finalizadaEn, participaciones) {
	return prisma.$transaction(async (tx) => {
		const { count } = await tx.sala.updateMany({
			where: { id: Number(id), estado: "en_curso" },
			data: { estado: "finalizada", finalizadaEn },
		});

		if (count === 0) {
			return false;
		}

		if (participaciones.length > 0) {
			await tx.participacionGrupal.createMany({
				data: participaciones.map((participacion) => ({
					salaId: Number(id),
					usuarioId: Number(participacion.usuarioId),
					estado: participacion.estado,
					resultado: participacion.resultado,
				})),
				skipDuplicates: true,
			});
		}

		return true;
	});
}
