import "dotenv/config";

const REQUIRED_VARS = ["JWT_SECRET", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

function getMissingVars() {
	return REQUIRED_VARS.filter((name) => {
		const value = process.env[name];
		return value === undefined || value === null || value === "";
	});
}

// Errores de configuración: en producción se aborta el arranque; en desarrollo se avisa y se sigue,
// para no romper el .env que ya tiene cada integrante del equipo. Nunca se imprime el valor del secreto.
function problemaDeConfiguracion(mensaje) {
	if (isProduction) {
		console.error(`[seguridad] Configuración inválida para producción: ${mensaje}`);
		process.exit(1);
	}

	console.warn(`[seguridad] Aviso (en producción el servidor no arrancaría): ${mensaje}`);
}

const missing = getMissingVars();

if (missing.length > 0) {
	console.error(
		`Faltan variables de entorno requeridas: ${missing.join(", ")}. Revisá backend/.env (usá .env.example como referencia).`,
	);
	process.exit(1);
}

// --- JWT_SECRET: largo y variedad mínimos (HS256 pide al menos 256 bits de secreto) ---

const JWT_SECRET_LONGITUD_MINIMA = 32;
const JWT_SECRET_CARACTERES_DISTINTOS_MINIMOS = 12;
const JWT_SECRETOS_DE_EJEMPLO = ["secret", "changeme", "cambiame", "password", "jwt_secret", "mindgame"];

function evaluarSecretoJwt(secreto) {
	const motivos = [];
	const minusculas = secreto.toLowerCase();

	if (secreto.length < JWT_SECRET_LONGITUD_MINIMA) {
		motivos.push(`tiene menos de ${JWT_SECRET_LONGITUD_MINIMA} caracteres`);
	}

	if (new Set(secreto).size < JWT_SECRET_CARACTERES_DISTINTOS_MINIMOS) {
		motivos.push(`tiene menos de ${JWT_SECRET_CARACTERES_DISTINTOS_MINIMOS} caracteres distintos`);
	}

	if (JWT_SECRETOS_DE_EJEMPLO.some((ejemplo) => minusculas.includes(ejemplo))) {
		motivos.push("contiene una palabra predecible");
	}

	return motivos;
}

const motivosSecretoDebil = evaluarSecretoJwt(process.env.JWT_SECRET);

if (motivosSecretoDebil.length > 0) {
	problemaDeConfiguracion(
		`JWT_SECRET es débil (${motivosSecretoDebil.join(", ")}). Generá uno con: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`,
	);
}

// --- JWT_EXPIRES_IN: segundos ("3600") o número + unidad ("30m", "12h", "1d") ---

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d").trim();
const JWT_VIGENCIA_REGEX = /^(\d+)\s?(s|m|h|d|w)?$/;
const SEGUNDOS_POR_UNIDAD = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
const JWT_VIGENCIA_MAXIMA_SEGUNDOS = 7 * 86400;

const vigenciaCoincide = JWT_VIGENCIA_REGEX.exec(JWT_EXPIRES_IN);

if (!vigenciaCoincide || Number(vigenciaCoincide[1]) === 0) {
	console.error(
		`JWT_EXPIRES_IN inválido: usá segundos ("3600") o un número con unidad s, m, h, d o w ("1d").`,
	);
	process.exit(1);
}

const vigenciaEnSegundos = Number(vigenciaCoincide[1]) * (SEGUNDOS_POR_UNIDAD[vigenciaCoincide[2]] ?? 1);

if (vigenciaEnSegundos > JWT_VIGENCIA_MAXIMA_SEGUNDOS) {
	problemaDeConfiguracion("JWT_EXPIRES_IN supera los 7 días: un token robado serviría demasiado tiempo.");
}

// --- Utilidades de lectura de variables ---

function leerEntero(nombre, porDefecto, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
	const crudo = process.env[nombre];

	if (crudo === undefined || crudo.trim() === "") {
		return porDefecto;
	}

	const valor = Number(crudo);

	if (!Number.isInteger(valor) || valor < min || valor > max) {
		console.error(`${nombre} inválido: debe ser un entero entre ${min} y ${max}.`);
		process.exit(1);
	}

	return valor;
}

function leerBooleano(nombre, porDefecto = false) {
	const crudo = (process.env[nombre] || "").trim().toLowerCase();
	return crudo === "" ? porDefecto : crudo === "true" || crudo === "1";
}

// Origen = esquema + host + puerto, sin barra final ni ruta (así lo envía el navegador en `Origin`).
function normalizarOrigen(origen) {
	return origen.trim().replace(/\/+$/, "").toLowerCase();
}

// `trust proxy` de Express: número de saltos ("1"), o los valores de Express ("loopback", "10.0.0.0/8").
// "true" a secas haría confiar en cualquier X-Forwarded-For (falsificable), así que equivale a 1 salto.
function leerTrustProxy() {
	const crudo = (process.env.TRUST_PROXY || "").trim();

	if (crudo === "" || crudo.toLowerCase() === "false" || crudo === "0") return false;
	if (crudo.toLowerCase() === "true") return 1;
	if (/^\d+$/.test(crudo)) return Number(crudo);
	return crudo;
}

const frontendUrl = normalizarOrigen(process.env.FRONTEND_URL || "http://localhost:5173");

// --- CORS (HTTP y Socket.io): lista de orígenes permitidos ---

function leerOrigenesPermitidos() {
	const crudo = (process.env.CORS_ORIGINS || "").trim();

	if (crudo === "") {
		if (isProduction) {
			console.error(
				"Falta CORS_ORIGINS: en producción hay que indicar los orígenes del frontend permitidos (separados por coma).",
			);
			process.exit(1);
		}

		return [
			...new Set(["http://localhost:5173", "http://127.0.0.1:5173", frontendUrl].map(normalizarOrigen)),
		];
	}

	const origenes = crudo.split(",").map(normalizarOrigen).filter(Boolean);

	if (
		origenes.length === 0 ||
		origenes.some((origen) => origen === "*" || !/^https?:\/\/[^/\s]+$/.test(origen))
	) {
		console.error(
			'CORS_ORIGINS inválido: usá orígenes completos separados por coma (p. ej. "https://mindgame.example.com"); no se admite "*".',
		);
		process.exit(1);
	}

	return [...new Set(origenes)];
}

const corsOrigins = leerOrigenesPermitidos();

if (isProduction && corsOrigins.some((origen) => !origen.startsWith("https://"))) {
	console.warn("[seguridad] Aviso: CORS_ORIGINS contiene orígenes sin HTTPS en producción.");
}

const trustProxy = leerTrustProxy();
const forceHttps = leerBooleano("FORCE_HTTPS");

if (isProduction && trustProxy === false) {
	console.warn(
		"[seguridad] Aviso: TRUST_PROXY sin definir en producción: detrás de un proxy, los límites de intentos tratarían a todos los usuarios como una sola IP.",
	);
}

if (forceHttps && trustProxy === false) {
	console.warn(
		"[seguridad] Aviso: FORCE_HTTPS=true sin TRUST_PROXY: detrás de un proxy TLS todas las peticiones se verían como HTTP y serían rechazadas.",
	);
}

// --- Rate limiting de la autenticación (en memoria; ver middlewares/rateLimit.middleware.js) ---

const rateLimit = {
	// Se apaga solo con NODE_ENV=test o con RATE_LIMIT_DISABLED=true (p. ej. para pruebas de humo).
	enabled: !isTest && !leerBooleano("RATE_LIMIT_DISABLED"),
	windowMs: leerEntero("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000, { min: 1000 }),
	// Intentos de login FALLIDOS por IP (los exitosos no cuentan: en un colegio muchos alumnos comparten IP).
	loginMax: leerEntero("LOGIN_RATE_LIMIT_MAX", 30),
	// Tope de TODOS los intentos de login por IP (también los exitosos): frena el uso del login como
	// herramienta para saturar bcrypt con cuentas propias.
	loginTotalMax: leerEntero("LOGIN_RATE_LIMIT_TOTAL_MAX", 300),
	// Intentos de login fallidos por cuenta (correo) e IP.
	loginAccountMax: leerEntero("LOGIN_ACCOUNT_RATE_LIMIT_MAX", 8),
	// Registros por IP (un aula entera puede registrarse desde la misma red).
	registerMax: leerEntero("REGISTER_RATE_LIMIT_MAX", 30),
	// Solicitudes de "olvidé mi contraseña" y de restablecimiento por IP.
	passwordResetMax: leerEntero("PASSWORD_RESET_RATE_LIMIT_MAX", 10),
	// Solicitudes de recuperación por correo (desde cualquier IP): evita bombardear la bandeja de una persona.
	passwordResetAccountMax: leerEntero("PASSWORD_RESET_ACCOUNT_RATE_LIMIT_MAX", 3),
};

const env = {
	nodeEnv,
	isProduction,
	isTest,
	port: process.env.PORT || 3000,

	db: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		name: process.env.DB_NAME,
	},

	frontendUrl,
	corsOrigins,

	// Detrás de un proxy que termina TLS (Render, Railway, nginx...): ver TRUST_PROXY y FORCE_HTTPS.
	trustProxy,
	forceHttps,

	// Tope del cuerpo JSON de las peticiones (formato de `bytes`: "100kb", "1mb").
	jsonBodyLimit: (process.env.JSON_BODY_LIMIT || "100kb").trim(),

	jwt: {
		secret: process.env.JWT_SECRET,
		// Siempre en segundos (número): jsonwebtoken interpreta un texto sin unidad ("3600") como milisegundos.
		expiresIn: vigenciaEnSegundos,
		issuer: (process.env.JWT_ISSUER || "mindgame-api").trim(),
		audience: (process.env.JWT_AUDIENCE || "mindgame-app").trim(),
	},

	// Costo de bcrypt (cada +1 duplica el tiempo). Los hashes existentes con otro costo siguen siendo válidos.
	bcryptRounds: leerEntero("BCRYPT_ROUNDS", 12, { min: 10, max: 15 }),

	rateLimit,

	smtp: {
		host: process.env.SMTP_HOST || "",
		port: process.env.SMTP_PORT || "",
		user: process.env.SMTP_USER || "",
		password: process.env.SMTP_PASSWORD || "",
		from: process.env.SMTP_FROM || "MindGame <no-reply@mindgame.local>",
	},

	resetTokenExpiresMin: leerEntero("RESET_TOKEN_EXPIRES_MIN", 30, { min: 1, max: 1440 }),

	admin: {
		email: process.env.ADMIN_EMAIL || "",
		password: process.env.ADMIN_PASSWORD || "",
	},

	// Código que debe presentar quien se registra como docente. Vacío = registro de docentes deshabilitado.
	docenteRegistrationCode: (process.env.DOCENTE_REGISTRATION_CODE || "").trim(),
};

export default env;
