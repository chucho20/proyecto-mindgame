import AppError from "../utils/AppError.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";
import * as nivelRepository from "../repositories/nivel.repository.js";
import * as progresoMisionRepository from "../repositories/progresoMision.repository.js";

export async function asignarPuntos(usuarioId, puntos, origen) {
	const usuario = await usuarioRepository.findById(usuarioId);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	const puntosAsignados = Number(puntos);

	if (!Number.isFinite(puntosAsignados) || puntosAsignados <= 0) {
		throw new AppError("La cantidad de puntos debe ser un número mayor que cero.", 400);
	}

	const nuevoTotal = usuario.puntosTotales + puntosAsignados;

	await usuarioRepository.update(usuarioId, {
		puntosTotales: nuevoTotal,
	});

	await verificarNivel(usuarioId);

	return {
		puntosTotales: nuevoTotal,
		nivelActual: (
			await usuarioRepository.findById(usuarioId)
		).nivelActual,
		origen: origen || null,
	};
}

export async function verificarNivel(usuarioId) {
	const usuario = await usuarioRepository.findById(usuarioId);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	const niveles = await nivelRepository.findAll();

	if (niveles.length === 0) {
		return usuario.nivelActual;
	}

	let nivelCorrespondiente = niveles[0].numero;

	for (const nivel of niveles) {
		if (usuario.puntosTotales >= nivel.puntosRequeridos) {
			nivelCorrespondiente = nivel.numero;
		} else {
			break;
		}
	}

	if (nivelCorrespondiente !== usuario.nivelActual) {
		await usuarioRepository.update(usuarioId, {
			nivelActual: nivelCorrespondiente,
		});
	}

	return nivelCorrespondiente;
}

export async function consultarProgreso(usuarioId) {
	const usuario = await usuarioRepository.findById(usuarioId);

	if (!usuario) {
		throw new AppError("Usuario no encontrado.", 404);
	}

	const misiones = await progresoMisionRepository.findAllByUsuario(usuarioId);

	const misionesCompletadas = misiones.filter(
		(mision) => mision.estado === "completada",
	).length;

	const niveles = await nivelRepository.findAll();

	const siguienteNivel = niveles.find(
		(nivel) => nivel.numero > usuario.nivelActual,
	) || null;

	return {
		puntosTotales: usuario.puntosTotales,
		nivelActual: usuario.nivelActual,
		misionesCompletadas,
		siguienteNivel,
	};
}