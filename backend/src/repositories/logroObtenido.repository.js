import prisma from "../config/prisma.js";

export async function findByUsuarioYLogro(usuarioId, logroId) {
	return prisma.logroObtenido.findUnique({
		where: {
			usuarioId_logroId: {
				usuarioId: Number(usuarioId),
				logroId: Number(logroId),
			},
		},
	});
}

export async function create({ usuarioId, logroId }) {
	return prisma.logroObtenido.create({
		data: {
			usuarioId: Number(usuarioId),
			logroId: Number(logroId),
		},
	});
}

export async function findAllByUsuario(usuarioId) {
	return prisma.logroObtenido.findMany({
		where: {
			usuarioId: Number(usuarioId),
		},
		include: {
			logro: true,
		},
		orderBy: {
			obtenidoEn: "desc",
		},
	});
}