import pool from "../config/db.js";

export async function create({ usuarioId, retoId, respuestaDada, esCorrecto, puntosObtenidos }) {
	const [result] = await pool.query(
		`INSERT INTO intentos_retos (usuario_id, reto_id, respuesta_dada, es_correcto, puntos_obtenidos)
			VALUES (?, ?, ?, ?, ?)`,
		[usuarioId, retoId, JSON.stringify(respuestaDada), esCorrecto, puntosObtenidos],
	);
	const [rows] = await pool.query("SELECT * FROM intentos_retos WHERE id = ? LIMIT 1", [result.insertId]);
	return rows[0];
}

export async function findByUsuarioYReto(usuarioId, retoId) {
	const [rows] = await pool.query(
		"SELECT * FROM intentos_retos WHERE usuario_id = ? AND reto_id = ? ORDER BY resuelto_en DESC",
		[usuarioId, retoId],
	);
	return rows;
}

/**
 * Cuenta cuántos retos distintos de una misión el usuario ya respondió
 * correctamente al menos una vez (usado para calcular si la misión está
 * completa).
 */
export async function countRetosCorrectosPorMision(usuarioId, misionId) {
	const [rows] = await pool.query(
		`SELECT COUNT(DISTINCT it.reto_id) AS total
			FROM intentos_retos it
			INNER JOIN retos r ON r.id = it.reto_id
			WHERE it.usuario_id = ? AND r.mision_id = ? AND it.es_correcto = 1`,
		[usuarioId, misionId],
	);
	return rows[0].total;
}
