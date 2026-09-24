import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

// Prisma 7 requiere un "driver adapter" explícito para conectar. No existe
// @prisma/adapter-mysql: el adaptador oficial de Prisma para MySQL es
// @prisma/adapter-mariadb (el driver mariadb es compatible con el
// protocolo de MySQL). Reusa las mismas variables DB_* que ya usa
// config/db.js, no hace falta duplicarlas.
const adapter = new PrismaMariaDb({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
