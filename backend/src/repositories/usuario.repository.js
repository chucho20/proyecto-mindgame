import pool from "../config/db.js";

export async function findByEmail(correo) {
	const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ? LIMIT 1", [correo]);
	return rows[0] || null;
}

export async function findByUsername(nombreUsuario) {
	const [rows] = await pool.query("SELECT * FROM usuarios WHERE nombre_usuario = ? LIMIT 1", [nombreUsuario]);
	return rows[0] || null;
}

export async function findById(id) {
	const [rows] = await pool.query("SELECT * FROM usuarios WHERE id = ? LIMIT 1", [id]);
	return rows[0] || null;
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
	const [result] = await pool.query(
		`INSERT INTO usuarios
			(nombre_completo, correo, nombre_usuario, password_hash, edad, grado_curso, rol, avatar, acepta_tratamiento_datos)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			nombreCompleto,
			correo,
			nombreUsuario,
			passwordHash,
			edad ?? null,
			gradoCurso ?? null,
			rol,
			avatar ?? null,
			aceptaTratamientoDatos,
		],
	);

	return findById(result.insertId);
}

export async function update(id, fields) {
	const allowedColumns = {
		nombreCompleto: "nombre_completo",
		edad: "edad",
		gradoCurso: "grado_curso",
		avatar: "avatar",
	};

	const setClauses = [];
	const values = [];

	for (const [key, column] of Object.entries(allowedColumns)) {
		if (fields[key] !== undefined) {
			setClauses.push(`${column} = ?`);
			values.push(fields[key]);
		}
	}

	if (setClauses.length === 0) {
		return findById(id);
	}

	values.push(id);

	await pool.query(`UPDATE usuarios SET ${setClauses.join(", ")} WHERE id = ?`, values);

	return findById(id);
}

export async function updatePassword(id, passwordHash) {
	await pool.query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [passwordHash, id]);
	return findById(id);
}
