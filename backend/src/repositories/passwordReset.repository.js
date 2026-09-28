import prisma from "../config/prisma.js";

export async function create({ usuarioId, tokenHash, expiraEn }) {
	return prisma.passwordReset.create({
		data: {
			usuarioId,
			tokenHash,
			expiraEn,
		},
	});
}

export async function findValidByTokenHash(tokenHash) {
	return prisma.passwordReset.findFirst({
		where: {
			tokenHash,
			usado: false,
			expiraEn: {
				gt: new Date(),
			},
		},
	});
}

export async function markAsUsed(id) {
	return prisma.passwordReset.update({
		where: { id },
		data: {
			usado: true,
		},
	});
}