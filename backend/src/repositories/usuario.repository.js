import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Los repositorios son la capa anticorrupción entre Prisma (camelCase) y el
// resto del backend / API (snake_case, igual que las columnas de la tabla).
// Este mapper devuelve exactamente la misma "fila" que devolvía `SELECT *`
// con mysql2, para que servicios, controllers y frontend no cambien.
function aFilaUsuario(usuario) {
	if (!usuario) {
		return null;
	}

	return {
		id: usuario.id,
		nombre_completo: usuario.nombreCompleto,
		correo: usuario.correo,
		nombre_usuario: usuario.nombreUsuario,
		password_hash: usuario.passwordHash,
		edad: usuario.edad,
		grado_curso: usuario.gradoCurso,
		rol: usuario.rol,
		avatar: usuario.avatar,
		// mysql2 devolvía los BOOLEAN (TINYINT(1)) como 0/1, no como true/false.
		acepta_tratamiento_datos: Number(usuario.aceptaTratamientoDatos),
		created_at: usuario.createdAt,
		updated_at: usuario.updatedAt,
		puntos_totales: usuario.puntosTotales,
		nivel_actual: usuario.nivelActual,
	};
}

export async function findByEmail(correo) {
	const usuario = await prisma.usuario.findUnique({ where: { correo } });
	return aFilaUsuario(usuario);
}

export async function findByUsername(nombreUsuario) {
	const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario } });
	return aFilaUsuario(usuario);
}

export async function findById(id) {
	const idNormalizado = normalizarId(id);
	if (idNormalizado === null) {
		return null;
	}

	const usuario = await prisma.usuario.findUnique({ where: { id: idNormalizado } });
	return aFilaUsuario(usuario);
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
	const usuario = await prisma.usuario.create({
		data: {
			nombreCompleto,
			correo,
			nombreUsuario,
			passwordHash,
			edad: edad ?? null,
			gradoCurso: gradoCurso ?? null,
			rol,
			avatar: avatar ?? null,
			aceptaTratamientoDatos: Boolean(aceptaTratamientoDatos),
		},
	});

	return aFilaUsuario(usuario);
}

export async function update(id, fields) {
	// Solo estos campos son editables desde el perfil; `undefined` significa
	// "no tocar" y `null` significa "dejar en NULL".
	const data = {};

	for (const key of ["nombreCompleto", "edad", "gradoCurso", "avatar"]) {
		if (fields[key] !== undefined) {
			data[key] = fields[key];
		}
	}

	if (Object.keys(data).length > 0) {
		await prisma.usuario.updateMany({ where: { id: Number(id) }, data });
	}

	return findById(id);
}

export async function updatePassword(id, passwordHash) {
	await prisma.usuario.updateMany({ where: { id: Number(id) }, data: { passwordHash } });
	return findById(id);
}
