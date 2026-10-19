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

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const recompensa = await prisma.recompensa.findUnique({ where: { id: idNormalizado } });
	return aFilaRecompensa(recompensa);
}
