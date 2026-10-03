import AppError from "../utils/AppError.js";
import * as misionRepository from "../repositories/mision.repository.js";
import * as progresoMisionRepository from "../repositories/progresoMision.repository.js";

const CATEGORIAS_VALIDAS = ["historica", "convivencia"];

function validarCategoria(categoria) {
	if (
		categoria !== undefined &&
		!CATEGORIAS_VALIDAS.includes(categoria)
	) {
		throw new AppError(
			"La categoría debe ser historica o convivencia.",
			400,
		);
	}
}

export async function listar(usuarioId, { categoria } = {}) {
	validarCategoria(categoria);

	const misiones = await misionRepository.findAllActivas({
		categoria,
	});

	const progresos =
		await progresoMisionRepository.findAllByUsuario(usuarioId);

	const progresoPorMision = new Map(
		progresos.map((progreso) => [
			progreso.misionId,
			progreso,
		]),
	);

	return misiones.map((mision) => ({
		...mision,
		progreso: progresoPorMision.get(mision.id) || null,
	}));
}

export async function obtenerPorId(id, usuarioId) {
	const mision = await misionRepository.findById(id);

	if (!mision) {
		throw new AppError("Misión no encontrada.", 404);
	}

	let progreso = null;

	if (usuarioId) {
		progreso = await progresoMisionRepository.findByUsuarioYMision(
			usuarioId,
			id,
		);
	}

	return {
		...mision,
		progreso,
	};
}

export async function listarAdmin() {
	return misionRepository.findAllAdmin();
}

export async function crear(data) {
	if (!data.titulo || !data.titulo.trim()) {
		throw new AppError(
			"El título de la misión es obligatorio.",
			400,
		);
	}

	validarCategoria(data.categoria);

	return misionRepository.create({
		titulo: data.titulo.trim(),
		descripcion: data.descripcion,
		orden: data.orden !== undefined ? Number(data.orden) : 0,
		estado: data.estado,
		categoria: data.categoria,
	});
}

export async function actualizar(id, data) {
	const mision = await misionRepository.findById(id);

	if (!mision) {
		throw new AppError("Misión no encontrada.", 404);
	}

	validarCategoria(data.categoria);

	return misionRepository.update(id, {
		titulo:
			data.titulo !== undefined
				? data.titulo.trim()
				: undefined,
		descripcion: data.descripcion,
		orden:
			data.orden !== undefined
				? Number(data.orden)
				: undefined,
		estado: data.estado,
		categoria: data.categoria,
	});
}

export async function cambiarEstado(id, estado) {
	const mision = await misionRepository.findById(id);

	if (!mision) {
		throw new AppError("Misión no encontrada.", 404);
	}

	if (!["activa", "inactiva"].includes(estado)) {
		throw new AppError(
			"El estado debe ser activa o inactiva.",
			400,
		);
	}

	return misionRepository.setEstado(id, estado);
}