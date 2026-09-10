import pool from "../config/db.js";

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	const sql = onlyActive
		? "SELECT * FROM historias WHERE mision_id = ? AND estado = 'activa' ORDER BY orden ASC, id ASC"
		: "SELECT * FROM historias WHERE mision_id = ? ORDER BY orden ASC, id ASC";
	const [rows] = await pool.query(sql, [misionId]);
	return rows;
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		const [rows] = await pool.query(
			"SELECT * FROM historias WHERE mision_id = ? ORDER BY orden ASC, id ASC",
			[misionId],
		);
		return rows;
	}

	const [rows] = await pool.query("SELECT * FROM historias ORDER BY mision_id ASC, orden ASC, id ASC");
	return rows;
}

export async function findById(id) {
	const [rows] = await pool.query("SELECT * FROM historias WHERE id = ? LIMIT 1", [id]);
	return rows[0] || null;
}

export async function create({ misionId, titulo, contenido, orden, estado }) {
	const [result] = await pool.query(
		"INSERT INTO historias (mision_id, titulo, contenido, orden, estado) VALUES (?, ?, ?, ?, ?)",
		[misionId, titulo, contenido, orden ?? 0, estado || "activa"],
	);
	return findById(result.insertId);
}

export async function update(id, { titulo, contenido, orden }) {
	const setClauses = [];
	const values = [];

	if (titulo !== undefined) {
		setClauses.push("titulo = ?");
		values.push(titulo);
	}
	if (contenido !== undefined) {
		setClauses.push("contenido = ?");
		values.push(contenido);
	}
	if (orden !== undefined) {
		setClauses.push("orden = ?");
		values.push(orden);
	}

	if (setClauses.length === 0) {
		return findById(id);
	}

	values.push(id);
	await pool.query(`UPDATE historias SET ${setClauses.join(", ")} WHERE id = ?`, values);
	return findById(id);
}

export async function setEstado(id, estado) {
	await pool.query("UPDATE historias SET estado = ? WHERE id = ?", [estado, id]);
	return findById(id);
}

export async function remove(id) {
	await pool.query("DELETE FROM historias WHERE id = ?", [id]);
}

export async function countAll() {
	const [rows] = await pool.query("SELECT COUNT(*) AS total FROM historias");
	return rows[0].total;
}
