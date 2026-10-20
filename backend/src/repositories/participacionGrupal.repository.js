import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Devuelve la fila (snake_case) de `participaciones_grupales`; con el usuario incluido agrega `nombre_usuario`.
function aFilaParticipacion(participacion) {
	return {
		id: participacion.id,
		sala_id: participacion.salaId,
		usuario_id: participacion.usuarioId,
		estado: participacion.estado,
		resultado: participacion.resultado,
		puntos_obtenidos: participacion.puntosObtenidos,
		created_at: participacion.createdAt,
		...(participacion.usuario ? { nombre_usuario: participacion.usuario.nombreUsuario } : {}),
	};
}

/** Guarda los puntos que ganó un participante al cerrar la actividad. */
export async function actualizarPuntos(salaId, usuarioId, puntos) {
	await prisma.participacionGrupal.updateMany({
		where: { salaId: Number(salaId), usuarioId: Number(usuarioId) },
		data: { puntosObtenidos: Number(puntos) },
	});
}

/** Participaciones registradas de una sala, con el nombre de usuario, en orden de registro. */
export async function findBySala(salaId) {
	const idNormalizado = normalizarId(salaId);
	if (idNormalizado === null) {
		return [];
	}

	const participaciones = await prisma.participacionGrupal.findMany({
		where: { salaId: idNormalizado },
		include: { usuario: { select: { nombreUsuario: true } } },
		orderBy: [{ id: "asc" }],
	});
	return participaciones.map(aFilaParticipacion);
}

/** La participación de un usuario en una sala (o `null`), para autorizar la consulta de resultados. */
export async function findBySalaYUsuario(salaId, usuarioId) {
	const salaIdNormalizado = normalizarId(salaId);
	const usuarioIdNormalizado = normalizarId(usuarioId);
	if (salaIdNormalizado === null || usuarioIdNormalizado === null) {
		return null;
	}

	const participacion = await prisma.participacionGrupal.findUnique({
		where: { salaId_usuarioId: { salaId: salaIdNormalizado, usuarioId: usuarioIdNormalizado } },
	});
	return participacion ? aFilaParticipacion(participacion) : null;
}
