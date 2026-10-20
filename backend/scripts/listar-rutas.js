/**
 * Auditoría de rutas (Sprint 5 · seguridad): lista TODAS las rutas registradas en la API con el método, la
 * ruta, si exigen sesión y qué roles las protegen, y falla (código 1) si alguna ruta sensible quedó expuesta.
 *
 * Uso: `npm run routes:audit` (o `node scripts/listar-rutas.js --json`; necesita las variables de entorno obligatorias, igual que el servidor).
 * No abre el servidor ni se conecta a la base de datos.
 */
import app, { MONTAJES } from "../src/app.js";
import authMiddleware from "../src/middlewares/auth.middleware.js";

// Únicas rutas que pueden responder sin token.
const PUBLICAS = new Set([
	"GET /api/health",
	"POST /api/auth/register",
	"POST /api/auth/login",
	"POST /api/auth/logout",
	"POST /api/auth/forgot-password",
	"POST /api/auth/reset-password",
]);

// Rol que debe exigir TODO lo que cuelga de cada prefijo.
const ROL_POR_PREFIJO = [
	["/api/admin", "administrador"],
	["/api/docente", "docente"],
	["/api/grupos", "estudiante"],
];

// Rutas que cambian datos y, a propósito, no se limitan a un rol (cada usuario edita su propio perfil).
const ESCRITURA_SIN_ROL_PERMITIDA = new Set(["PUT /api/profile/"]);

const METODOS_DE_ESCRITURA = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function unir(prefijo, ruta) {
	return `${prefijo}${ruta === "/" ? "/" : ruta}`.replace(/\/{2,}/g, "/");
}

// Resume los manejadores de una cadena: ¿incluye authMiddleware? ¿qué roles exige (intersección)?
function resumirGuardas(manejadores) {
	let autenticada = false;
	let roles = null;

	for (const manejador of manejadores) {
		if (manejador === authMiddleware) {
			autenticada = true;
		}

		if (Array.isArray(manejador.roles)) {
			roles = roles === null ? [...manejador.roles] : roles.filter((rol) => manejador.roles.includes(rol));
		}
	}

	return { autenticada, roles };
}

function recorrerRouter(stack, prefijo, guardasDelRouter, filas) {
	for (const capa of stack) {
		if (!capa.route) {
			// Middleware a nivel de router (`router.use(...)`): protege las rutas que se declaran después.
			guardasDelRouter.push(capa.handle);
			continue;
		}

		const manejadores = [...guardasDelRouter, ...capa.route.stack.map((c) => c.handle)];
		const { autenticada, roles } = resumirGuardas(manejadores);

		for (const metodo of Object.keys(capa.route.methods)) {
			filas.push({ metodo: metodo.toUpperCase(), ruta: unir(prefijo, capa.route.path), autenticada, roles });
		}
	}
}

const filas = [];

// Rutas declaradas directamente en la app (p. ej. /api/health).
for (const capa of app.router.stack) {
	if (!capa.route) continue;

	const manejadores = capa.route.stack.map((c) => c.handle);
	// Las entradas que solo cuelgan un limitador de intentos (antes de leer el cuerpo) no son rutas de negocio.
	if (manejadores.every((manejador) => manejador.esLimitador)) continue;

	const { autenticada, roles } = resumirGuardas(manejadores);
	for (const metodo of Object.keys(capa.route.methods)) {
		filas.push({ metodo: metodo.toUpperCase(), ruta: capa.route.path, autenticada, roles });
	}
}

for (const [prefijo, router] of MONTAJES) {
	recorrerRouter(router.stack, prefijo, [], filas);
}

const violaciones = [];

for (const fila of filas) {
	const clave = `${fila.metodo} ${fila.ruta}`;
	const rolEsperado = ROL_POR_PREFIJO.find(([prefijo]) => fila.ruta.startsWith(`${prefijo}/`))?.[1];

	if (!fila.autenticada && !PUBLICAS.has(clave)) {
		violaciones.push(`${clave}: no exige sesión y no está en la lista de rutas públicas.`);
	}

	if (rolEsperado && !(fila.roles?.length === 1 && fila.roles[0] === rolEsperado)) {
		violaciones.push(`${clave}: debería exigir únicamente el rol "${rolEsperado}".`);
	}

	if (
		fila.autenticada &&
		!fila.roles &&
		METODOS_DE_ESCRITURA.has(fila.metodo) &&
		!ESCRITURA_SIN_ROL_PERMITIDA.has(clave)
	) {
		violaciones.push(`${clave}: modifica datos y no exige ningún rol.`);
	}
}

// `--json`: salida para otras herramientas (p. ej. una prueba que recorre la matriz ruta x rol).
if (process.argv.includes("--json")) {
	console.log(JSON.stringify({ rutas: filas, violaciones }));
	process.exit(violaciones.length > 0 ? 1 : 0);
}

console.log("| Método | Ruta | Sesión | Roles permitidos |");
console.log("| --- | --- | --- | --- |");
for (const fila of filas) {
	const sesion = fila.autenticada ? "sí" : "no (pública)";
	const roles = !fila.autenticada
		? "-"
		: fila.roles
			? fila.roles.join(", ") || "(ninguno)"
			: "cualquier autenticado";
	console.log(`| ${fila.metodo} | ${fila.ruta} | ${sesion} | ${roles} |`);
}

console.log(`\nTotal de rutas: ${filas.length}`);

if (violaciones.length > 0) {
	console.error("\nRutas con problemas de protección:");
	for (const violacion of violaciones) console.error(`- ${violacion}`);
	process.exit(1);
}

console.log("Sin rutas sensibles desprotegidas.");
process.exit(0);
