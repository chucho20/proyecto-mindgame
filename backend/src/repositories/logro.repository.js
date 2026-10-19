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

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const logro = await prisma.logro.findUnique({ where: { id: idNormalizado } });
	return aFilaLogro(logro);
}
