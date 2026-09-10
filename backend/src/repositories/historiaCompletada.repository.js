import pool from "../config/db.js";

export async function findByUsuarioYHistoria(usuarioId, historiaId) {
	const [rows] = await pool.query(
		"SELECT * FROM historias_completadas WHERE usuario_id = ? AND historia_id = ? LIMIT 1",
		[usuarioId, historiaId],
	);
	return rows[0] || null;
}

/**
 * Marca una historia como leída. Puede lanzar un error con
 * `code === "ER_DUP_ENTRY"` si ya estaba marcada (UNIQUE usuario_id +
 * historia_id) — el caller lo trata como éxito idempotente.
 */
export async function create(usuarioId, historiaId) {
	const [result] = await pool.query(
		"INSERT INTO historias_completadas (usuario_id, historia_id) VALUES (?, ?)",
		[usuarioId, historiaId],
	);
	const [rows] = await pool.query("SELECT * FROM historias_completadas WHERE id = ? LIMIT 1", [
		result.insertId,
	]);
	return rows[0];
}

export async function findAllByUsuario(usuarioId) {
	const [rows] = await pool.query("SELECT * FROM historias_completadas WHERE usuario_id = ?", [usuarioId]);
	return rows;
}
