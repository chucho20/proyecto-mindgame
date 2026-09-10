import pool from "../config/db.js";

export async function findByUsuarioYActividad(usuarioId, actividadId) {
	const [rows] = await pool.query(
		"SELECT * FROM actividades_completadas WHERE usuario_id = ? AND actividad_id = ? LIMIT 1",
		[usuarioId, actividadId],
	);
	return rows[0] || null;
}

/**
 * Marca una actividad como completada. Puede lanzar un error con
 * `code === "ER_DUP_ENTRY"` si ya estaba completada (UNIQUE usuario_id +
 * actividad_id) — el caller lo trata como éxito idempotente.
 */
export async function create(usuarioId, actividadId) {
	const [result] = await pool.query(
		"INSERT INTO actividades_completadas (usuario_id, actividad_id) VALUES (?, ?)",
		[usuarioId, actividadId],
	);
	const [rows] = await pool.query("SELECT * FROM actividades_completadas WHERE id = ? LIMIT 1", [
		result.insertId,
	]);
	return rows[0];
}

export async function findAllByUsuario(usuarioId) {
	const [rows] = await pool.query("SELECT * FROM actividades_completadas WHERE usuario_id = ?", [usuarioId]);
	return rows;
}

/**
 * Cuenta cuántas actividades de una misión el usuario ya completó (usado
 * para calcular si la misión está completa).
 */
export async function countCompletadasPorMision(usuarioId, misionId) {
	const [rows] = await pool.query(
		`SELECT COUNT(*) AS total
			FROM actividades_completadas ac
			INNER JOIN actividades a ON a.id = ac.actividad_id
			WHERE ac.usuario_id = ? AND a.mision_id = ?`,
		[usuarioId, misionId],
	);
	return rows[0].total;
}
