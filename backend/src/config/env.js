import "dotenv/config";

const REQUIRED_VARS = ["JWT_SECRET", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

function getMissingVars() {
	return REQUIRED_VARS.filter((name) => {
		const value = process.env[name];
		return value === undefined || value === null || value === "";
	});
}

const missing = getMissingVars();

if (missing.length > 0) {
	console.error(
		`Faltan variables de entorno requeridas: ${missing.join(", ")}. Revisá backend/.env (usá .env.example como referencia).`,
	);
	process.exit(1);
}

const env = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: process.env.PORT || 3000,

	db: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		name: process.env.DB_NAME,
	},

	frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

	jwt: {
		secret: process.env.JWT_SECRET,
		expiresIn: process.env.JWT_EXPIRES_IN || "1d",
	},

	smtp: {
		host: process.env.SMTP_HOST || "",
		port: process.env.SMTP_PORT || "",
		user: process.env.SMTP_USER || "",
		password: process.env.SMTP_PASSWORD || "",
		from: process.env.SMTP_FROM || "MindGame <no-reply@mindgame.local>",
	},

	resetTokenExpiresMin: Number(process.env.RESET_TOKEN_EXPIRES_MIN) || 30,

	admin: {
		email: process.env.ADMIN_EMAIL || "",
		password: process.env.ADMIN_PASSWORD || "",
	},
};

export default env;
