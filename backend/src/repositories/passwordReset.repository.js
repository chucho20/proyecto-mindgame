import pool from "../config/db.js";

export async function create({ usuarioId, tokenHash, expiraEn }) {
	const [result] = await pool.query(
		"INSERT INTO password_resets (usuario_id, token_hash, expira_en) VALUES (?, ?, ?)",
		[usuarioId, tokenHash, expiraEn],
	);

	const [rows] = await pool.query("SELECT * FROM password_resets WHERE id = ? LIMIT 1", [result.insertId]);

	return rows[0] || null;
}

export async function findValidByTokenHash(tokenHash) {
	const [rows] = await pool.query(
		`SELECT * FROM password_resets
			WHERE token_hash = ? AND usado = FALSE AND expira_en > NOW()
			LIMIT 1`,
		[tokenHash],
	);

	return rows[0] || null;
}

export async function markAsUsed(id) {
	await pool.query("UPDATE password_resets SET usado = TRUE WHERE id = ?", [id]);
}
