import prisma from "../config/prisma.js";

export async function findAll() {
	return prisma.nivel.findMany({
		orderBy: {
			numero: "asc",
		},
	});
}

export async function findByNumero(numero) {
	return prisma.nivel.findUnique({
		where: {
			numero: Number(numero),
		},
	});
}
