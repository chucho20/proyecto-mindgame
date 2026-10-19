import AppError from "../utils/AppError.js";
import * as retoRepository from "../repositories/reto.repository.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as intentoRetoRepository from "../repositories/intentoReto.repository.js";
import { obtenerEvaluador } from "./evaluadores/evaluadorRegistry.js";
import * as misionService from "./mision.service.js";
import * as progresoService from "./progreso.service.js";
import { esEnteroValido } from "../utils/validators.js";

const TIPOS_VALIDOS = ["seleccion_multiple", "verdadero_falso", "relacion_elementos", "orden_cronologico"];

// Lista blanca de campos que un estudiante puede ver de un reto. Es exactamente el
// conjunto que devolvía el endpoint antes de agregar `retroalimentacion`: así, una
// columna nueva en la tabla no se filtra por defecto a los estudiantes.
const CAMPOS_RETO_ESTUDIANTE = [
	"id",
	"mision_id",
	"tipo",
	"enunciado",
	"opciones",
	"puntos",
	"orden",
	"estado",
	"created_at",
	"updated_at",
];

/**
 * Nunca devuelve `respuesta_correcta` ni `retroalimentacion` a un estudiante:
 * solo copia los campos de la lista blanca (la explicación se entrega recién al
 * responder). Las funciones *Admin de este archivo sí devuelven la fila completa
 * (la necesitan para editarla).
 */
function sanitizarReto(reto) {
	if (!reto) {
		return reto;
	}

	return Object.fromEntries(
		CAMPOS_RETO_ESTUDIANTE.filter((campo) => campo in reto).map((campo) => [campo, reto[campo]]),
	);
}

export async function listarPorMision(misionId) {
	const mision = await misionRepository.findById(misionId);

	if (!mision || mision.estado !== "activa") {
		throw new AppError("Misión no encontrada.", 404);
	}

	const retos = await retoRepository.findByMisionId(misionId, { onlyActive: true });
	return retos.map(sanitizarReto);
}

/**
 * Evalúa la respuesta de un estudiante usando el evaluador Strategy que
 * corresponda a `reto.tipo` (evaluadorRegistry.js). Esta función NO conoce
 * los detalles de ningún tipo de reto en particular — agregar un tipo nuevo
 * no requiere tocar esta función (RNF-012).
 */
export async function responder(retoId, usuarioId, respuestaUsuario) {
	const reto = await retoRepository.findById(retoId);

	if (!reto || reto.estado !== "activo") {
		throw new AppError("Reto no encontrado.", 404);
	}

	const evaluador = obtenerEvaluador(reto.tipo);

	if (!evaluador) {
		throw new AppError("No hay un evaluador configurado para este tipo de reto.", 500);
	}

	const { esCorrecto, puntosObtenidos: puntosDelReto } = evaluador.evaluar(reto, respuestaUsuario);

	// Regla de puntos (RF-014): un reto suma puntos SOLO la primera vez que se
	// responde bien. Los aciertos repetidos y las respuestas incorrectas no
	// suman, para que no se puedan "farmear" puntos repitiendo el mismo reto.
	// El repositorio lo decide y suma los puntos a usuarios.puntos_totales en la misma
	// transacción que registra el intento (ver createConPuntosDelPrimerAcierto).
	const nivelAnterior = esCorrecto ? await progresoService.obtenerNivelActual(usuarioId) : null;

	const intento = await intentoRetoRepository.createConPuntosDelPrimerAcierto({
		usuarioId,
		retoId,
		respuestaDada: respuestaUsuario,
		esCorrecto,
		puntosPrimerAcierto: puntosDelReto,
	});
	const puntosObtenidos = intento.puntos_obtenidos;

	let progreso = null;

	if (esCorrecto) {
		await misionService.actualizarProgresoSiCompleta(reto.mision_id, usuarioId);

		// Los puntos ya quedaron guardados; nivel, recompensas y logros se evalúan en un
		// paso idempotente aparte (GET /api/progreso lo repite si este paso no llega a correr).
		if (puntosObtenidos > 0) {
			progreso = await progresoService.evaluarProgresionTrasPuntos(usuarioId, puntosObtenidos, nivelAnterior);
		}
	}

	// `progreso` (puntos totales, nivel, recompensas y logros nuevos) es null si
	// esta respuesta no sumó puntos.
	return { esCorrecto, puntosObtenidos, progreso };
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
			errors.push(`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(", ")}.`);
		}
	}

	if (esCreacion || data.enunciado !== undefined) {
		if (typeof data.enunciado !== "string" || data.enunciado.trim().length === 0) {
			errors.push("El enunciado es obligatorio.");
		}
	}

	if (esCreacion && (data.respuestaCorrecta === undefined || data.respuestaCorrecta === null)) {
		errors.push("La respuesta correcta es obligatoria.");
	}

	if (data.puntos !== undefined && data.puntos !== null && !esEnteroValido(data.puntos, { min: 0 })) {
		errors.push("Los puntos deben ser un número entero mayor o igual a 0.");
	}

	if (data.orden !== undefined && data.orden !== null && !esEnteroValido(data.orden)) {
		errors.push("El orden debe ser un número entero.");
	}

	return errors;
}

export async function crear(data) {
	const errors = validarReto(data, { esCreacion: true });

	if (errors.length > 0) {
		throw new AppError("Datos de reto inválidos.", 400, errors);
	}

	const mision = await misionRepository.findById(data.misionId);
	if (!mision) {
		throw new AppError("La misión indicada no existe.", 400);
	}

	return retoRepository.create({
		misionId: data.misionId,
		tipo: data.tipo,
		enunciado: data.enunciado.trim(),
		opciones: data.opciones ?? null,
		respuestaCorrecta: data.respuestaCorrecta,
		puntos: data.puntos !== undefined ? Number(data.puntos) : 10,
		orden: data.orden !== undefined ? Number(data.orden) : 0,
		estado: "activo",
	});
}

export async function actualizar(id, data) {
	await obtenerAdmin(id);

	const errors = validarReto(data, { esCreacion: false });
	if (errors.length > 0) {
		throw new AppError("Datos de reto inválidos.", 400, errors);
	}

	return retoRepository.update(id, {
		tipo: data.tipo,
		enunciado: data.enunciado !== undefined ? data.enunciado.trim() : undefined,
		opciones: data.opciones,
		respuestaCorrecta: data.respuestaCorrecta,
		puntos: data.puntos !== undefined ? Number(data.puntos) : undefined,
		orden: data.orden !== undefined ? Number(data.orden) : undefined,
	});
}

export async function cambiarEstado(id, estado) {
	if (!["activo", "inactivo"].includes(estado)) {
		throw new AppError("Estado inválido. Debe ser 'activo' o 'inactivo'.", 400);
	}

	await obtenerAdmin(id);
	return retoRepository.setEstado(id, estado);
}

export async function eliminar(id) {
	await obtenerAdmin(id);
	await retoRepository.remove(id);
}
