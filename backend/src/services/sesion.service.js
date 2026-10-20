import { verifyToken } from "../utils/jwt.util.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";

export class SesionInvalidaError extends Error {
	constructor(motivo) {
		super(motivo);
		this.name = "SesionInvalidaError";
		this.motivo = motivo;
	}
}

/**
 * Valida un JWT contra la firma Y contra la base de datos. Un token firmado correctamente deja de servir si
 * el usuario fue borrado o si su rol cambió desde que se emitió (una lectura por clave primaria por llamada).
 * Devuelve `{ id, rol, exp }`, con el rol tal cual está en la base. Lanza `SesionInvalidaError` si no sirve;
 * cualquier otro error (p. ej. la base caída) se propaga para que el llamador responda 500, no 401.
 */
export async function autenticarToken(token) {
	let payload;

	try {
		payload = verifyToken(token);
	} catch (_error) {
		throw new SesionInvalidaError("token_invalido");
	}

	const usuario = await usuarioRepository.findAuthById(payload.id);

	if (!usuario) {
		throw new SesionInvalidaError("usuario_inexistente");
	}

	if (usuario.rol !== payload.rol) {
		throw new SesionInvalidaError("rol_cambiado");
	}

	return { id: usuario.id, rol: usuario.rol, exp: payload.exp };
}

/**
 * Vuelve a comprobar que el usuario de una sesión ya abierta (socket) siga existiendo con el mismo rol.
 * Devuelve `false` si fue borrado o cambió de rol; los errores de la base se propagan.
 */
export async function sesionSigueVigente({ id, rol }) {
	const usuario = await usuarioRepository.findAuthById(id);
	return Boolean(usuario) && usuario.rol === rol;
}
