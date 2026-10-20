import { autenticarToken, SesionInvalidaError } from "../services/sesion.service.js";
import { registrarError } from "../utils/logger.js";

// Solo estudiantes y docentes participan en actividades grupales; el administrador no usa salas.
const ROLES_PERMITIDOS = ["estudiante", "docente"];
const LONGITUD_MAXIMA_TOKEN = 2048;

// Error de handshake: el cliente lo recibe en `connect_error` con `err.message` y `err.data.codigo`.
function errorDeHandshake(codigo, mensaje) {
	const error = new Error(mensaje);
	error.data = { codigo };
	return error;
}

/**
 * Middleware de `io.use`: autentica el handshake con el mismo JWT que la API REST
 * (`socket.handshake.auth.token`, con o sin el prefijo "Bearer "). Si es válido deja
 * la identidad en `socket.data.user = { id, rol }`; la identidad y el rol NUNCA se
 * leen de los eventos que mande el cliente.
 */
export default async function socketAuthMiddleware(socket, next) {
	const crudo = socket.handshake?.auth?.token;

	if (typeof crudo !== "string" || crudo.length === 0 || crudo.length > LONGITUD_MAXIMA_TOKEN) {
		return next(errorDeHandshake("no_autorizado", "No autorizado. Falta el token de autenticación."));
	}

	const token = crudo.startsWith("Bearer ") ? crudo.slice("Bearer ".length) : crudo;

	let sesion;
	try {
		// Misma validación que la API REST: firma, vigencia y que el usuario exista con el mismo rol.
		sesion = await autenticarToken(token);
	} catch (error) {
		if (error instanceof SesionInvalidaError) {
			return next(errorDeHandshake("token_invalido", "No autorizado. Token inválido o expirado."));
		}

		registrarError("socketAuth.middleware", error);
		return next(errorDeHandshake("error_interno", "No se pudo validar la sesión. Intentá de nuevo."));
	}

	if (!ROLES_PERMITIDOS.includes(sesion.rol)) {
		return next(errorDeHandshake("rol_no_permitido", "Tu rol no puede usar las actividades en tiempo real."));
	}

	socket.data.user = { id: sesion.id, rol: sesion.rol };
	// `exp` está en segundos desde epoch; se usa para cortar los eventos de una sesión vencida.
	socket.data.tokenExpiraEn = sesion.exp * 1000;

	return next();
}
