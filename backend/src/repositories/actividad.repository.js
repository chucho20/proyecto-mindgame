import pool from "../config/db.js";

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	const sql = onlyActive
		? "SELECT * FROM actividades WHERE mision_id = ? AND estado = 'activa' ORDER BY orden ASC, id ASC"
		: "SELECT * FROM actividades WHERE mision_id = ? ORDER BY orden ASC, id ASC";
	const [rows] = await pool.query(sql, [misionId]);
	return rows;
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		const [rows] = await pool.query(
			"SELECT * FROM actividades WHERE mision_id = ? ORDER BY orden ASC, id ASC",
			[misionId],
		);
		return rows;
	}

	const [rows] = await pool.query("SELECT * FROM actividades ORDER BY mision_id ASC, orden ASC, id ASC");
	return rows;
}

export async function findById(id) {
	const [rows] = await pool.query("SELECT * FROM actividades WHERE id = ? LIMIT 1", [id]);
	return rows[0] || null;
}

export async function create({ misionId, titulo, descripcion, tipo, orden, estado }) {
	const [result] = await pool.query(
		"INSERT INTO actividades (mision_id, titulo, descripcion, tipo, orden, estado) VALUES (?, ?, ?, ?, ?, ?)",
		[misionId ?? null, titulo, descripcion ?? null, tipo, orden ?? 0, estado || "activa"],
	);
	return findById(result.insertId);
}

export async function update(id, { titulo, descripcion, tipo, orden }) {
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
	if (tipo !== undefined) {
		setClauses.push("tipo = ?");
		values.push(tipo);
	}
	if (orden !== undefined) {
		setClauses.push("orden = ?");
		values.push(orden);
	}

	if (setClauses.length === 0) {
		return findById(id);
	}

	values.push(id);
	await pool.query(`UPDATE actividades SET ${setClauses.join(", ")} WHERE id = ?`, values);
	return findById(id);
}

export async function setEstado(id, estado) {
	await pool.query("UPDATE actividades SET estado = ? WHERE id = ?", [estado, id]);
	return findById(id);
}

export async function remove(id) {
	await pool.query("DELETE FROM actividades WHERE id = ?", [id]);
}

export async function countAll() {
	const [rows] = await pool.query("SELECT COUNT(*) AS total FROM actividades");
	return rows[0].total;
}

export async function countByMisionId(misionId, { onlyActive = false } = {}) {
	const sql = onlyActive
		? "SELECT COUNT(*) AS total FROM actividades WHERE mision_id = ? AND estado = 'activa'"
		: "SELECT COUNT(*) AS total FROM actividades WHERE mision_id = ?";
	const [rows] = await pool.query(sql, [misionId]);
	return rows[0].total;
}
