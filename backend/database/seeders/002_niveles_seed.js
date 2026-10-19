import "dotenv/config";

import mysql from "mysql2/promise";

// Niveles iniciales. Los umbrales son provisionales: la ERS (Anexo D) deja las
// reglas numéricas de puntos y niveles pendientes de balance de juego, y se
// pueden ajustar luego sin tocar el código (tabla `niveles`).
// ServicioDeProgreso asume que el nivel 1 requiere 0 puntos.
// La migración 023_seed_niveles_iniciales.sql inserta los mismos valores en bases nuevas;
// este seeder sigue siendo idempotente y debe mantenerse en sincronía con ella.
const NIVELES = [
	{ numero: 1, puntosRequeridos: 0 },
	{ numero: 2, puntosRequeridos: 100 },
	{ numero: 3, puntosRequeridos: 250 },
	{ numero: 4, puntosRequeridos: 500 },
	{ numero: 5, puntosRequeridos: 1000 },
];

async function seedNiveles() {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	});

	try {
		// Mantiene los timestamps en UTC, igual que el adaptador Prisma (ver migrate.js).
		await connection.query("SET time_zone = '+00:00'");

		let creados = 0;

		for (const { numero, puntosRequeridos } of NIVELES) {
			// INSERT IGNORE respeta los niveles ya existentes (idempotente) y no
			// pisa los umbrales que un administrador haya ajustado.
			const [result] = await connection.query(
				"INSERT IGNORE INTO niveles (numero, puntos_requeridos) VALUES (?, ?)",
				[numero, puntosRequeridos],
			);

			creados += result.affectedRows;
		}

		console.log(`Niveles creados: ${creados}. Niveles ya existentes omitidos: ${NIVELES.length - creados}.`);
	} finally {
		await connection.end();
	}
}

seedNiveles()
	.then(() => {
		console.log("Proceso de seed de niveles finalizado.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Error al ejecutar el seed de niveles:", error.message);
		process.exit(1);
	});
