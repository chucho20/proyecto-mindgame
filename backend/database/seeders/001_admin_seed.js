import "dotenv/config";

import bcrypt from "bcrypt";
import mysql from "mysql2/promise";

const SALT_ROUNDS = 10;

async function seedAdmin() {
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminEmail || !adminPassword) {
		console.log("ADMIN_EMAIL o ADMIN_PASSWORD no están definidos. Se omite el seed de administrador.");
		return;
	}

	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	});

	try {
		const [existing] = await connection.query("SELECT id FROM usuarios WHERE correo = ? LIMIT 1", [
			adminEmail,
		]);

		if (existing.length > 0) {
			console.log(`El administrador ${adminEmail} ya existe. Se omite el seed.`);
			return;
		}

		const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

		await connection.query(
			`INSERT INTO usuarios
				(nombre_completo, correo, nombre_usuario, password_hash, rol, acepta_tratamiento_datos)
			VALUES (?, ?, ?, ?, 'administrador', TRUE)`,
			["Administrador MindGame", adminEmail, "admin", passwordHash],
		);

		console.log(`Administrador creado: ${adminEmail}`);
	} finally {
		await connection.end();
	}
}

seedAdmin()
	.then(() => {
		console.log("Proceso de seed finalizado.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error al ejecutar el seed de administrador:", error.message);
		process.exit(1);
	});
