import AppError from "../utils/AppError.js";
import * as mensajePositivoRepository from "../repositories/mensajePositivo.repository.js";

export async function obtenerAleatorioPorContexto(contexto) {
	if (!contexto || typeof contexto !== "string") {
		throw new AppError(
			"El contexto del mensaje es obligatorio.",
			400,
		);
	}

	const mensajes =
		await mensajePositivoRepository.findByContexto(contexto);

	if (mensajes.length === 0) {
		return null;
	}

	const indiceAleatorio = Math.floor(
		Math.random() * mensajes.length,
	);

	return mensajes[indiceAleatorio];
}

export async function listarAdmin() {
	return mensajePositivoRepository.findAllAdmin();
}

export async function obtenerPorId(id) {
	const mensaje = await mensajePositivoRepository.findById(id);

	if (!mensaje) {
		throw new AppError(
			"Mensaje positivo no encontrado.",
			404,
		);
	}

	return mensaje;
}

export async function crear(data) {
	if (
		!data.contenido ||
		typeof data.contenido !== "string" ||
		!data.contenido.trim()
	) {
		throw new AppError(
			"El contenido del mensaje es obligatorio.",
			400,
		);
	}

	if (
		!data.contexto ||
		typeof data.contexto !== "string" ||
		!data.contexto.trim()
	) {
		throw new AppError(
			"El contexto del mensaje es obligatorio.",
			400,
		);
	}

	return mensajePositivoRepository.create({
		contenido: data.contenido.trim(),
		contexto: data.contexto.trim(),
		estado: data.estado,
	});
}

export async function actualizar(id, data) {
	const mensaje = await mensajePositivoRepository.findById(id);

	if (!mensaje) {
		throw new AppError(
			"Mensaje positivo no encontrado.",
			404,
		);
	}

	if (
		data.contenido !== undefined &&
		(typeof data.contenido !== "string" ||
			!data.contenido.trim())
	) {
		throw new AppError(
			"El contenido del mensaje no puede estar vacío.",
			400,
		);
	}

	if (
		data.contexto !== undefined &&
		(typeof data.contexto !== "string" ||
			!data.contexto.trim())
	) {
		throw new AppError(
			"El contexto del mensaje no puede estar vacío.",
			400,
		);
	}

	return mensajePositivoRepository.update(id, {
		contenido:
			data.contenido !== undefined
				? data.contenido.trim()
				: undefined,
		contexto:
			data.contexto !== undefined
				? data.contexto.trim()
				: undefined,
	});
}

export async function cambiarEstado(id, estado) {
	const mensaje = await mensajePositivoRepository.findById(id);

	if (!mensaje) {
		throw new AppError(
			"Mensaje positivo no encontrado.",
			404,
		);
	}

	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError(
			"El estado debe ser activa o inactiva.",
			400,
		);
	}

	return mensajePositivoRepository.setEstado(id, estado);
}