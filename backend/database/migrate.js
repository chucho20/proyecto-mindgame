import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable(connection) {
	await connection.query(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE KEY uq_schema_migrations_name (name)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`);
}

async function getAppliedMigrations(connection) {
	const [rows] = await connection.query("SELECT name FROM schema_migrations");
	return new Set(rows.map((row) => row.name));
}

function getMigrationFiles() {
	if (!fs.existsSync(MIGRATIONS_DIR)) {
		return [];
	}

	return fs
		.readdirSync(MIGRATIONS_DIR)
		.filter((file) => file.endsWith(".sql"))
		.sort();
}

async function runMigrations() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		multipleStatements: true,
	});

	try {
		await ensureMigrationsTable(connection);

		const applied = await getAppliedMigrations(connection);
		const files = getMigrationFiles();
		const pending = files.filter((file) => !applied.has(file));

		if (pending.length === 0) {
			console.log("No hay migraciones pendientes. Base de datos al día.");
			return;
		}

		for (const file of pending) {
			const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

			console.log(`Aplicando migración: ${file}`);

			await connection.query(sql);
			await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);

			console.log(`Migración aplicada: ${file}`);
		}

		console.log(`Migraciones aplicadas: ${pending.length}`);
	} finally {
		await connection.end();
	}
}

runMigrations()
	.then(() => {
		console.log("Proceso de migración finalizado.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error al ejecutar las migraciones:", error.message);
		process.exit(1);
	});
