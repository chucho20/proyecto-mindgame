import prisma from "../config/prisma.js";

// Devuelve la fila (snake_case) de la tabla `niveles`, igual que el resto de repositorios.
function aFilaNivel(nivel) {
	if (!nivel) {
		return null;
	}

	return {
		id: nivel.id,
		numero: nivel.numero,
		puntos_requeridos: nivel.puntosRequeridos,
		created_at: nivel.createdAt,
		updated_at: nivel.updatedAt,
	};
}

/**
 * Todos los niveles ordenados de menor a mayor número. La tabla es chica
 * (un puñado de filas), así que el servicio de progreso la lee completa.
 */
export async function findAll() {
	const niveles = await prisma.nivel.findMany({ orderBy: { numero: "asc" } });
	return niveles.map(aFilaNivel);
}
