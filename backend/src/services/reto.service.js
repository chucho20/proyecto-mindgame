import AppError from "../utils/AppError.js";
import * as retoRepository from "../repositories/reto.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as intentoRetoRepository from "../repositories/intentoReto.repository.js";
import { obtenerEvaluador } from "./evaluadores/evaluadorRegistry.js";
import * as misionService from "./mision.service.js";
import * as progresoService from "./progreso.service.js";

const TIPOS_VALIDOS = [
	"seleccion_multiple",
	"verdadero_falso",
	"relacion_elementos",
	"orden_cronologico",
];

/**
 * Nunca devuelve `respuestaCorrecta` a un estudiante.
 * Las funciones Admin sí pueden devolverla.
 */
function sanitizarReto(reto) {
	if (!reto) {
		return reto;
	}

	const { respuestaCorrecta: _respuestaCorrecta, ...safeReto } = reto;
	return safeReto;
}

export async function listarPorMision(misionId) {
	const mision = await misionRepository.findById(misionId);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const retos = await retoRepository.findByMisionId(misionId, {
		onlyActive: true,
	});

	return retos.map(sanitizarReto);
}

export async function responder(
	retoId,
	usuarioId,
	respuestaUsuario,
) {
	const reto = await retoRepository.findById(retoId);

	if (!reto || reto.estado !== "activo") {
		throw new AppError("Reto no encontrado.", 404);
	}

	const evaluador = obtenerEvaluador(reto.tipo);

	if (!evaluador) {
		throw new AppError(
			"No hay un evaluador configurado para este tipo de reto.",
			500,
		);
	}

	const { esCorrecto, puntosObtenidos } =
		evaluador.evaluar(reto, respuestaUsuario);

	await intentoRetoRepository.create({
		usuarioId,
		retoId,
		respuestaDada: respuestaUsuario,
		esCorrecto,
		puntosObtenidos,
	});

	if (esCorrecto) {
		// Asigna los puntos reales al usuario.
		await progresoService.asignarPuntos(
			usuarioId,
			puntosObtenidos,
			"reto",
		);

		await misionService.actualizarProgresoSiCompleta(
			reto.misionId,
			usuarioId,
		);
	}

	return {
		esCorrecto,
		puntosObtenidos,
		retroalimentacion: reto.retroalimentacion || null,
	};
}

// --- Admin CRUD ---

export async function listarAdmin({ misionId } = {}) {
	return retoRepository.findAllAdmin({ misionId });
}

export async function obtenerAdmin(id) {
	const reto = await retoRepository.findById(id);

	if (!reto) {
		throw new AppError("Reto no encontrado.", 404);
	}

	return reto;
}

function validarReto(data, { esCreacion }) {
	const errors = [];

	if (esCreacion && !data.misionId) {
		errors.push("La misión es obligatoria.");
	}

	if (esCreacion || data.tipo !== undefined) {
		if (!TIPOS_VALIDOS.includes(data.tipo)) {
			errors.push(
				`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(", ")}.`,
			);
		}
	}

	if (esCreacion || data.enunciado !== undefined) {
		if (
			typeof data.enunciado !== "string" ||
			data.enunciado.trim().length === 0
		) {
			errors.push("El enunciado es obligatorio.");
		}
	}

	if (
		esCreacion &&
		(data.respuestaCorrecta === undefined ||
			data.respuestaCorrecta === null)
	) {
		errors.push("La respuesta correcta es obligatoria.");
	}

	if (
		data.puntos !== undefined &&
		data.puntos !== null &&
		!Number.isFinite(Number(data.puntos))
	) {
		errors.push("Los puntos deben ser un número.");
	}

	return errors;
}

export async function crear(data) {
	const errors = validarReto(data, { esCreacion: true });

	if (errors.length > 0) {
		throw new AppError(
			"Datos de reto inválidos.",
			400,
			errors,
		);
	}

	const mision = await misionRepository.findById(data.misionId);

	if (!mision) {
		throw new AppError(
			"La misión indicada no existe.",
			400,
		);
	}

	return retoRepository.create({
		misionId: data.misionId,
		tipo: data.tipo,
		enunciado: data.enunciado.trim(),
		retroalimentacion: data.retroalimentacion ?? null,
		opciones: data.opciones ?? null,
		respuestaCorrecta: data.respuestaCorrecta,
		puntos:
			data.puntos !== undefined
				? Number(data.puntos)
				: 10,
		orden:
			data.orden !== undefined
				? Number(data.orden)
				: 0,
		estado: "activo",
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarReto(data, {
		esCreacion: false,
	});

	if (errors.length > 0) {
		throw new AppError(
			"Datos de reto inválidos.",
			400,
			errors,
		);
	}

	return retoRepository.update(id, {
		tipo: data.tipo,
		enunciado:
			data.enunciado !== undefined
				? data.enunciado.trim()
				: undefined,
		retroalimentacion: data.retroalimentacion,
		opciones: data.opciones,
		respuestaCorrecta: data.respuestaCorrecta,
		puntos:
			data.puntos !== undefined
				? Number(data.puntos)
				: undefined,
		orden:
			data.orden !== undefined
				? Number(data.orden)
				: undefined,
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activo", "inactivo"].includes(estado)) {
		throw new AppError(
			"Estado inválido. Debe ser 'activo' o 'inactivo'.",
			400,
		);
	}

	await obtenerAdmin(id);

	return retoRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await retoRepository.remove(id);
}