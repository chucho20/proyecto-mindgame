import prisma from "../config/prisma.js";

export async function findByUsuarioYRecompensa(
	usuarioId,
	recompensaId,
) {
	return prisma.recompensaObtenida.findUnique({
		where: {
			usuarioId_recompensaId: {
				usuarioId: Number(usuarioId),
				recompensaId: Number(recompensaId),
			},
		},
	});
}

export async function create({ usuarioId, recompensaId }) {
	return prisma.recompensaObtenida.create({
		data: {
			usuarioId: Number(usuarioId),
			recompensaId: Number(recompensaId),
		},
	});
}

export async function findAllByUsuario(usuarioId) {
	return prisma.recompensaObtenida.findMany({
		where: {
			usuarioId: Number(usuarioId),
		},
		include: {
			recompensa: true,
		},
		orderBy: {
			obtenidaEn: "desc",
		},
	});
}