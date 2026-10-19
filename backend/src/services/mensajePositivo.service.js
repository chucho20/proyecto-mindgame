import AppError from "../utils/AppError.js";
import { CATEGORIA_CONVIVENCIA, CONTEXTOS_CONOCIDOS } from "../constants/convivencia.js";
import { LONGITUD_MAXIMA_TEXTO } from "../utils/validators.js";
import * as mensajePositivoRepository from "../repositories/mensajePositivo.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";

const LONGITUD_MAXIMA_CONTEXTO = 100;

/**
 * Elige al azar un mensaje ACTIVO del contexto indicado (RF-013). Devuelve la fila
 * completa o `null` si no hay ninguno cargado.
 */
export async function obtenerAleatorioPorContexto(contexto) {
	const mensajes = await mensajePositivoRepository.findActivosByContexto(contexto);

	if (mensajes.length === 0) {
		return null;
	}

	return mensajes[Math.floor(Math.random() * mensajes.length)];
}

/**
 * Texto del mensaje positivo que corresponde mostrar tras una acción del estudiante:
 * solo las misiones de convivencia lo muestran, y si no hay mensajes cargados para el
 * contexto devuelve `null`. Es un adorno de la respuesta: tanto la búsqueda de la misión
 * como la del mensaje quedan dentro del mismo resguardo; si algo falla se registra y se
 * devuelve `null`, porque la acción del estudiante (con sus puntos) ya quedó guardada y
 * no tiene que terminar en un 500.
 */
export async function obtenerTextoParaMision(misionId, contexto) {
	if (!misionId) {
		return null;
	}

	try {
		const mision = await misionRepository.findById(misionId);

		if (!mision || mision.categoria !== CATEGORIA_CONVIVENCIA) {
			return null;
		}

		const mensaje = await obtenerAleatorioPorContexto(contexto);
		return mensaje ? mensaje.contenido : null;
	} catch (error) {
		console.error("Error inesperado al elegir el mensaje positivo:", error);
		return null;
	}
}

// --- Admin CRUD ---

export async function listarAdmin() {
	return mensajePositivoRepository.findAllAdmin();
}

export async function obtenerAdmin(id) {
	const mensaje = await mensajePositivoRepository.findById(id);

	if (!mensaje) {
		throw new AppError("Mensaje positivo no encontrado.", 404);
	}

	return mensaje;
}

function validarMensaje(data, { esCreacion }) {
	const errors = [];

	if (esCreacion || data.contenido !== undefined) {
		if (typeof data.contenido !== "string" || data.contenido.trim().length === 0) {
			errors.push("El contenido es obligatorio.");
		} else if (data.contenido.trim().length > LONGITUD_MAXIMA_TEXTO) {
			errors.push(`El contenido no puede superar los ${LONGITUD_MAXIMA_TEXTO} caracteres.`);
		}
	}

	if (esCreacion || data.contexto !== undefined) {
		if (typeof data.contexto !== "string" || data.contexto.trim().length === 0) {
			errors.push("El contexto es obligatorio.");
		} else if (data.contexto.trim().length > LONGITUD_MAXIMA_CONTEXTO) {
			errors.push(`El contexto no puede superar los ${LONGITUD_MAXIMA_CONTEXTO} caracteres.`);
		} else if (!CONTEXTOS_CONOCIDOS.includes(data.contexto.trim())) {
			// Un contexto que el backend nunca consulta guardaría un mensaje que no se muestra jamás.
			errors.push(`El contexto debe ser uno de: ${CONTEXTOS_CONOCIDOS.join(", ")}.`);
		}
	}

	return errors;
}

export async function crear(data) {
	const errors = validarMensaje(data, { esCreacion: true });

	if (errors.length > 0) {
		throw new AppError("Datos de mensaje positivo inválidos.", 400, errors);
	}

	return mensajePositivoRepository.create({
		contenido: data.contenido.trim(),
		contexto: data.contexto.trim(),
		estado: "activa",
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarMensaje(data, { esCreacion: false });
	if (errors.length > 0) {
		throw new AppError("Datos de mensaje positivo inválidos.", 400, errors);
	}

	return mensajePositivoRepository.update(id, {
		contenido: data.contenido !== undefined ? data.contenido.trim() : undefined,
		contexto: data.contexto !== undefined ? data.contexto.trim() : undefined,
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError("Estado inválido. Debe ser 'activa' o 'inactiva'.", 400);
	}

	await obtenerAdmin(id);
	return mensajePositivoRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await mensajePositivoRepository.remove(id);
}
