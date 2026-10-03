import { Prisma } from "../generated/prisma/index.js";
import AppError from "../utils/AppError.js";

import * as logroRepository from "../repositories/logro.repository.js";
import * as logroObtenidoRepository from "../repositories/logroObtenido.repository.js";
import * as progresoService from "./progreso.service.js";

export async function listarObtenidasPorUsuario(usuarioId) {
	return logroObtenidoRepository.findAllByUsuario(usuarioId);
}

export async function verificarYOtorgar(usuarioId) {
	const progreso = await progresoService.consultarProgreso(usuarioId);
	const logros = await logroRepository.findAllActivos();

	const logrosOtorgados = [];

	for (const logro of logros) {
		let cumpleCondicion = false;

		if (logro.condicionTipo === "puntos") {
			cumpleCondicion =
				progreso.puntosTotales >= logro.condicionValor;
		}

		if (logro.condicionTipo === "nivel") {
			cumpleCondicion =
				progreso.nivelActual >= logro.condicionValor;
		}

		if (!cumpleCondicion) {
			continue;
		}

		try {
			const obtenido = await logroObtenidoRepository.create({
				usuarioId,
				logroId: logro.id,
			});

			logrosOtorgados.push(obtenido);
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				// Ya había sido otorgado. Es un resultado idempotente.
				continue;
			}

			throw error;
		}
	}

	return logrosOtorgados;
}

export async function listarAdmin() {
	return logroRepository.findAllAdmin();
}

export async function crear(data) {
	if (!data.nombre) {
		throw new AppError("El nombre del logro es obligatorio.", 400);
	}

	if (!data.condicionTipo) {
		throw new AppError(
			"El tipo de condición del logro es obligatorio.",
			400,
		);
	}

	if (!["puntos", "nivel"].includes(data.condicionTipo)) {
		throw new AppError(
			"El tipo de condición debe ser puntos o nivel.",
			400,
		);
	}

	if (
		data.condicionValor === undefined ||
		!Number.isInteger(Number(data.condicionValor)) ||
		Number(data.condicionValor) < 0
	) {
		throw new AppError(
			"El valor de la condición debe ser un número entero mayor o igual a cero.",
			400,
		);
	}

	return logroRepository.create({
		nombre: data.nombre,
		descripcion: data.descripcion,
		icono: data.icono,
		condicionTipo: data.condicionTipo,
		condicionValor: Number(data.condicionValor),
		estado: data.estado,
	});
}

export async function actualizar(id, data) {
	const logro = await logroRepository.findById(id);

	if (!logro) {
		throw new AppError("Logro no encontrado.", 404);
	}

	if (
		data.condicionTipo !== undefined &&
		!["puntos", "nivel"].includes(data.condicionTipo)
	) {
		throw new AppError(
			"El tipo de condición debe ser puntos o nivel.",
			400,
		);
	}

	if (
		data.condicionValor !== undefined &&
		(!Number.isInteger(Number(data.condicionValor)) ||
			Number(data.condicionValor) < 0)
	) {
		throw new AppError(
			"El valor de la condición debe ser un número entero mayor o igual a cero.",
			400,
		);
	}

	return logroRepository.update(id, {
		nombre: data.nombre,
		descripcion: data.descripcion,
		icono: data.icono,
		condicionTipo: data.condicionTipo,
		condicionValor:
			data.condicionValor !== undefined
				? Number(data.condicionValor)
				: undefined,
	});
}

export async function cambiarEstado(id, estado) {
	const logro = await logroRepository.findById(id);

	if (!logro) {
		throw new AppError("Logro no encontrado.", 404);
	}

	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError(
			"El estado debe ser activa o inactiva.",
			400,
		);
	}

	return logroRepository.setEstado(id, estado);
}