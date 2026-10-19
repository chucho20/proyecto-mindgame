import prisma from "../config/prisma.js";

// Devuelve la misma fila (snake_case) que devolvía `SELECT *` con mysql2.
function aFilaPasswordReset(reset) {
	if (!reset) {
		return null;
	}

	return {
		id: reset.id,
		usuario_id: reset.usuarioId,
		token_hash: reset.tokenHash,
		expira_en: reset.expiraEn,
		// mysql2 devolvía los BOOLEAN (TINYINT(1)) como 0/1.
		usado: Number(reset.usado),
		created_at: reset.createdAt,
	};
}

export async function create({ usuarioId, tokenHash, expiraEn }) {
	const reset = await prisma.passwordReset.create({
		data: { usuarioId: Number(usuarioId), tokenHash, expiraEn },
	});

	return aFilaPasswordReset(reset);
}

export async function findValidByTokenHash(tokenHash) {
	// La vigencia se compara con la hora de la app (no con NOW() de MySQL):
	// Prisma guarda y lee los DATETIME en UTC, así que ambos lados quedan en la
	// misma referencia.
	const reset = await prisma.passwordReset.findFirst({
		where: { tokenHash, usado: false, expiraEn: { gt: new Date() } },
	});

	return aFilaPasswordReset(reset);
}

export async function markAsUsed(id) {
	await prisma.passwordReset.updateMany({ where: { id: Number(id) }, data: { usado: true } });
}
