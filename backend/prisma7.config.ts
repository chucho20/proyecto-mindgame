// Generado por Prisma. Ajustado para reusar las variables DB_* que ya
// existen en .env (mismas que usa src/config/db.js) en vez de duplicar las
// credenciales en un DATABASE_URL separado.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: databaseUrl,
	},
});
