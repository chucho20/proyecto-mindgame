import pool from "../config/db.js";

// Nota: las columnas `opciones` y `respuesta_correcta` son tipo JSON nativo
// de MySQL. mysql2 las deserializa automáticamente al leerlas (llegan como
// objeto/arreglo/booleano/string ya parseados, nunca como texto JSON crudo),
// así que NO hay que hacer JSON.parse manual acá — intentarlo revienta en
// respuestas cuyo valor correcto ya es un string primitivo (ej.
// seleccion_multiple con respuesta_correcta = "a": JSON.parse("a") explota
// porque no es JSON válido sin comillas).

export async function findByMisionId(misionId, { onlyActive = false } = {}) {
	const sql = onlyActive
		? "SELECT * FROM retos WHERE mision_id = ? AND estado = 'activo' ORDER BY orden ASC, id ASC"
		: "SELECT * FROM retos WHERE mision_id = ? ORDER BY orden ASC, id ASC";
	const [rows] = await pool.query(sql, [misionId]);
	return rows;
}

export async function findAllAdmin({ misionId } = {}) {
	if (misionId) {
		const [rows] = await pool.query("SELECT * FROM retos WHERE mision_id = ? ORDER BY orden ASC, id ASC", [
			misionId,
		]);
		return rows;
	}

	const [rows] = await pool.query("SELECT * FROM retos ORDER BY mision_id ASC, orden ASC, id ASC");
	return rows;
}

export async function findById(id) {
	const [rows] = await pool.query("SELECT * FROM retos WHERE id = ? LIMIT 1", [id]);
	return rows[0] || null;
}

export async function create({
	misionId,
	tipo,
	enunciado,
	opciones,
	respuestaCorrecta,
	puntos,
	orden,
	estado,
}) {
	const [result] = await pool.query(
		`INSERT INTO retos (mision_id, tipo, enunciado, opciones, respuesta_correcta, puntos, orden, estado)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			misionId,
			tipo,
			enunciado,
			opciones === undefined ? null : JSON.stringify(opciones),
			JSON.stringify(respuestaCorrecta),
			puntos ?? 10,
			orden ?? 0,
			estado || "activo",
		],
	);
	return findById(result.insertId);
}

export async function update(id, { tipo, enunciado, opciones, respuestaCorrecta, puntos, orden }) {
	const setClauses = [];
	const values = [];

	if (tipo !== undefined) {
		setClauses.push("tipo = ?");
		values.push(tipo);
	}
	if (enunciado !== undefined) {
		setClauses.push("enunciado = ?");
		values.push(enunciado);
	}
	if (opciones !== undefined) {
		setClauses.push("opciones = ?");
		values.push(JSON.stringify(opciones));
	}
	if (respuestaCorrecta !== undefined) {
		setClauses.push("respuesta_correcta = ?");
		values.push(JSON.stringify(respuestaCorrecta));
	}
	if (puntos !== undefined) {
		setClauses.push("puntos = ?");
		values.push(puntos);
	}
	if (orden !== undefined) {
		setClauses.push("orden = ?");
		values.push(orden);
	}

	if (setClauses.length === 0) {
		return findById(id);
	}

	values.push(id);
	await pool.query(`UPDATE retos SET ${setClauses.join(", ")} WHERE id = ?`, values);
	return findById(id);
}

export async function setEstado(id, estado) {
	await pool.query("UPDATE retos SET estado = ? WHERE id = ?", [estado, id]);
	return findById(id);
}

export async function remove(id) {
	await pool.query("DELETE FROM retos WHERE id = ?", [id]);
}

export async function countAll() {
	const [rows] = await pool.query("SELECT COUNT(*) AS total FROM retos");
	return rows[0].total;
}

export async function countByMisionId(misionId, { onlyActive = false } = {}) {
	const sql = onlyActive
		? "SELECT COUNT(*) AS total FROM retos WHERE mision_id = ? AND estado = 'activo'"
		: "SELECT COUNT(*) AS total FROM retos WHERE mision_id = ?";
	const [rows] = await pool.query(sql, [misionId]);
	return rows[0].total;
}
