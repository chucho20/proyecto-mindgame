import { Prisma } from "../generated/prisma/index.js";
import AppError from "../utils/AppError.js";

import * as recompensaRepository from "../repositories/recompensa.repository.js";
import * as recompensaObtenidaRepository from "../repositories/recompensaObtenida.repository.js";
import * as progresoService from "./progreso.service.js";

export async function listarObtenidasPorUsuario(usuarioId) {
	return recompensaObtenidaRepository.findAllByUsuario(usuarioId);
}

export async function verificarYOtorgar(usuarioId) {
	const progreso = await progresoService.consultarProgreso(usuarioId);
	const recompensas = await recompensaRepository.findAllActivas();

	const recompensasOtorgadas = [];

	for (const recompensa of recompensas) {
		let cumpleCondicion = false;

		if (recompensa.condicionTipo === "puntos") {
			cumpleCondicion =
				progreso.puntosTotales >= recompensa.condicionValor;
		}

		if (recompensa.condicionTipo === "nivel") {
			cumpleCondicion =
				progreso.nivelActual >= recompensa.condicionValor;
		}

		if (!cumpleCondicion) {
			continue;
		}

		try {
			const obtenida =
				await recompensaObtenidaRepository.create({
					usuarioId,
					recompensaId: recompensa.id,
				});

			recompensasOtorgadas.push(obtenida);
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				// Ya había sido otorgada. Es un resultado idempotente.
				continue;
			}

			throw error;
		}
	}

	return recompensasOtorgadas;
}

export async function listarAdmin() {
	return recompensaRepository.findAllAdmin();
}

export async function crear(data) {
	if (!data.nombre) {
		throw new AppError("El nombre de la recompensa es obligatorio.", 400);
	}

	if (!data.condicionTipo) {
		throw new AppError(
			"El tipo de condición de la recompensa es obligatorio.",
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

	return recompensaRepository.create({
		nombre: data.nombre,
		descripcion: data.descripcion,
		icono: data.icono,
		condicionTipo: data.condicionTipo,
		condicionValor: Number(data.condicionValor),
		estado: data.estado,
	});
}

export async function actualizar(id, data) {
	const recompensa = await recompensaRepository.findById(id);

	if (!recompensa) {
		throw new AppError("Recompensa no encontrada.", 404);
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

	return recompensaRepository.update(id, {
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
	const recompensa = await recompensaRepository.findById(id);

	if (!recompensa) {
		throw new AppError("Recompensa no encontrada.", 404);
	}

	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError(
			"El estado debe ser activa o inactiva.",
			400,
		);
	}

	return recompensaRepository.setEstado(id, estado);
}