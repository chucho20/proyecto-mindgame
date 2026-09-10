import pool from "../config/db.js";

export async function findAllActivas() {
	const [rows] = await pool.query(
		"SELECT * FROM misiones WHERE estado = 'activa' ORDER BY orden ASC, id ASC",
	);
	return rows;
}

export async function findAllAdmin() {
	const [rows] = await pool.query("SELECT * FROM misiones ORDER BY orden ASC, id ASC");
	return rows;
}

export async function findById(id) {
	const [rows] = await pool.query("SELECT * FROM misiones WHERE id = ? LIMIT 1", [id]);
	return rows[0] || null;
}

export async function create({ titulo, descripcion, orden, estado }) {
	const [result] = await pool.query(
		"INSERT INTO misiones (titulo, descripcion, orden, estado) VALUES (?, ?, ?, ?)",
		[titulo, descripcion ?? null, orden ?? 0, estado || "activa"],
	);
	return findById(result.insertId);
}

export async function update(id, { titulo, descripcion, orden }) {
	const setClauses = [];
	const values = [];

	if (titulo !== undefined) {
		setClauses.push("titulo = ?");
		values.push(titulo);
	}
	if (descripcion !== undefined) {
		setClauses.push("descripcion = ?");
		values.push(descripcion);
	}
	if (orden !== undefined) {
		setClauses.push("orden = ?");
		values.push(orden);
	}

	if (setClauses.length === 0) {
		return findById(id);
	}

	values.push(id);
	await pool.query(`UPDATE misiones SET ${setClauses.join(", ")} WHERE id = ?`, values);
	return findById(id);
}

export async function setEstado(id, estado) {
	await pool.query("UPDATE misiones SET estado = ? WHERE id = ?", [estado, id]);
	return findById(id);
}

export async function remove(id) {
	await pool.query("DELETE FROM misiones WHERE id = ?", [id]);
}

export async function countAll() {
	const [rows] = await pool.query("SELECT COUNT(*) AS total FROM misiones");
	return rows[0].total;
}
