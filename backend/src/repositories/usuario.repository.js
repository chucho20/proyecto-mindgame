import prisma from "../config/prisma.js";

export async function findByEmail(correo) {
	return prisma.usuario.findUnique({
		where: { correo },
	});
}

export async function findByUsername(nombreUsuario) {
	return prisma.usuario.findUnique({
		where: { nombreUsuario },
	});
}

export async function findById(id) {
	return prisma.usuario.findUnique({
		where: { id: Number(id) },
	});
}

export async function create({
	nombreCompleto,
	correo,
	nombreUsuario,
	passwordHash,
	edad,
	gradoCurso,
	rol,
	avatar,
	aceptaTratamientoDatos,
}) {
	return prisma.usuario.create({
		data: {
			nombreCompleto,
			correo,
			nombreUsuario,
			passwordHash,
			edad: edad ?? null,
			gradoCurso: gradoCurso ?? null,
			rol,
			avatar: avatar ?? null,
			aceptaTratamientoDatos,
		},
	});
}

export async function update(id, fields) {
	return prisma.usuario.update({
		where: { id: Number(id) },
		data: fields,
	});
}

export async function updatePassword(id, passwordHash) {
	return prisma.usuario.update({
		where: { id: Number(id) },
		data: { passwordHash },
	});
}