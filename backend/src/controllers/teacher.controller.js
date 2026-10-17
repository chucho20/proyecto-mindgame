import { prisma } from "../config/prisma.js";

async function obtenerEstadisticasEstudiante(estudianteId) {
	const [misionesCompletadas, historiasCompletadas, actividadesCompletadas, intentos] = await Promise.all([
		prisma.progresoMision.count({
			where: {
				usuarioId: estudianteId,
				estado: "completada",
			},
		}),
		prisma.historiaCompletada.count({
			where: { usuarioId: estudianteId },
		}),
		prisma.actividadCompletada.count({
			where: { usuarioId: estudianteId },
		}),
		prisma.intentoReto.aggregate({
			where: { usuarioId: estudianteId },
			_count: { _all: true },
			_sum: { puntosObtenidos: true },
		}),
	]);

	const intentosTotales = intentos._count._all;

	const intentosCorrectos = await prisma.intentoReto.count({
		where: {
			usuarioId: estudianteId,
			esCorrecto: true,
		},
	});

	return {
		estudianteId,
		misionesCompletadas,
		historiasCompletadas,
		actividadesCompletadas,
		retos: {
			intentosTotales,
			intentosCorrectos,
			intentosIncorrectos: intentosTotales - intentosCorrectos,
			puntosObtenidos: intentos._sum.puntosObtenidos ?? 0,
		},
	};
}

export async function obtenerEstadisticasGrupo(req, res) {
	try {
		const docenteId = Number(req.user.id);
		const grupoId = Number(req.params.id);

		if (
			!Number.isSafeInteger(docenteId) ||
			docenteId <= 0 ||
			!Number.isSafeInteger(grupoId) ||
			grupoId <= 0
		) {
			return res.status(400).json({
				message: "Identificador inválido",
			});
		}

		const grupo = await prisma.grupo.findFirst({
			where: {
				id: grupoId,
				docenteId,
			},
			select: {
				id: true,
				nombre: true,
				codigo: true,
				estudiantes: {
					select: {
						estudiante: {
							select: {
								id: true,
								nombreCompleto: true,
								nombreUsuario: true,
							},
						},
					},
				},
			},
		});

		if (!grupo) {
			return res.status(404).json({
				message: "Grupo no encontrado",
			});
		}

		const estudiantes = await Promise.all(
			grupo.estudiantes.map(async ({ estudiante }) => ({
				...estudiante,
				estadisticas: await obtenerEstadisticasEstudiante(estudiante.id),
			})),
		);

		return res.status(200).json({
			grupo: {
				id: grupo.id,
				nombre: grupo.nombre,
				codigo: grupo.codigo,
			},
			totalEstudiantes: estudiantes.length,
			estudiantes,
		});
	} catch (error) {
		console.error("Error al obtener estadísticas del grupo:", error);

		return res.status(500).json({
			message: "Error al obtener estadísticas del grupo",
		});
	}
}

export async function obtenerEstadisticasEstudianteDocente(req, res) {
	try {
		const docenteId = Number(req.user.id);
		const estudianteId = Number(req.params.id);

		if (
			!Number.isSafeInteger(docenteId) ||
			docenteId <= 0 ||
			!Number.isSafeInteger(estudianteId) ||
			estudianteId <= 0
		) {
			return res.status(400).json({
				message: "Identificador inválido",
			});
		}

		// El estudiante debe pertenecer a al menos un grupo del docente.
		const pertenencia = await prisma.grupoEstudiante.findFirst({
			where: {
				estudianteId,
				grupo: {
					docenteId,
				},
			},
			select: {
				estudiante: {
					select: {
						id: true,
						nombreCompleto: true,
						nombreUsuario: true,
					},
				},
			},
		});

		if (!pertenencia) {
			// Respuesta uniforme para no revelar estudiantes ajenos.
			return res.status(404).json({
				message: "Estudiante no encontrado",
			});
		}

		const estadisticas = await obtenerEstadisticasEstudiante(estudianteId);

		return res.status(200).json({
			estudiante: pertenencia.estudiante,
			estadisticas,
		});
	} catch (error) {
		console.error("Error al obtener estadísticas del estudiante:", error);

		return res.status(500).json({
			message: "Error al obtener estadísticas del estudiante",
		});
	}
}
