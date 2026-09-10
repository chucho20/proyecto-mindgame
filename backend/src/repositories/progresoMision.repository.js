import pool from "../config/db.js";

export async function findByUsuarioYMision(usuarioId, misionId) {
	const [rows] = await pool.query(
		"SELECT * FROM progreso_misiones WHERE usuario_id = ? AND mision_id = ? LIMIT 1",
		[usuarioId, misionId],
	);
	return rows[0] || null;
}

export async function findAllByUsuario(usuarioId) {
	const [rows] = await pool.query("SELECT * FROM progreso_misiones WHERE usuario_id = ?", [usuarioId]);
	return rows;
}

/**
 * Crea el registro de progreso de una misión para un usuario. Puede lanzar
 * un error con `code === "ER_DUP_ENTRY"` si ya existe (UNIQUE usuario_id +
 * mision_id) — el caller decide cómo manejar la carrera (ver mision.service).
 */
export async function create(usuarioId, misionId, estado = "en_progreso") {
	const [result] = await pool.query(
		"INSERT INTO progreso_misiones (usuario_id, mision_id, estado, iniciada_en) VALUES (?, ?, ?, NOW())",
		[usuarioId, misionId, estado],
	);
	const [rows] = await pool.query("SELECT * FROM progreso_misiones WHERE id = ? LIMIT 1", [result.insertId]);
	return rows[0];
}

export async function updateEstado(usuarioId, misionId, estado) {
	if (estado === "completada") {
		await pool.query(
			"UPDATE progreso_misiones SET estado = ?, completada_en = NOW() WHERE usuario_id = ? AND mision_id = ?",
			[estado, usuarioId, misionId],
		);
	} else {
		await pool.query("UPDATE progreso_misiones SET estado = ? WHERE usuario_id = ? AND mision_id = ?", [
			estado,
			usuarioId,
			misionId,
		]);
	}
	return findByUsuarioYMision(usuarioId, misionId);
}
