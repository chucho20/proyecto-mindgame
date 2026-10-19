import prisma from "../config/prisma.js";
import { normalizarId } from "../utils/dbIds.js";

// Estadísticas "en bruto" de actividad de un estudiante, sin ceros omitidos.
function estadisticasVacias() {
	return {
		misiones_completadas: 0,
		misiones_en_progreso: 0,
		historias_completadas: 0,
		actividades_completadas: 0,
		intentos_totales: 0,
		intentos_correctos: 0,
		retos_acertados: 0,
		puntos_obtenidos_retos: 0,
	};
}

/**
 * Cuentas de actividad de VARIOS estudiantes con consultas agregadas (una por
 * tabla, sin importar cuántos estudiantes sean): misiones completadas y en
 * progreso, historias y actividades completadas, e intentos de retos (totales,
 * correctos, retos distintos acertados y puntos ganados con retos).
 *
 * Devuelve un objeto `{ [estudianteId]: {...} }` con una entrada por cada id
 * válido, aunque el estudiante no tenga actividad (todo en cero).
 */
export async function resumirPorEstudiantes(estudianteIds) {
	const ids = [...new Set((estudianteIds ?? []).map(normalizarId).filter((id) => id !== null))];
	const resumen = Object.fromEntries(ids.map((id) => [id, estadisticasVacias()]));

	if (ids.length === 0) {
		return resumen;
	}

	const [progresos, historias, actividades, intentos, aciertosPorReto] = await Promise.all([
		prisma.progresoMision.groupBy({
			by: ["usuarioId", "estado"],
			where: { usuarioId: { in: ids } },
			_count: { _all: true },
		}),
		prisma.historiaCompletada.groupBy({
			by: ["usuarioId"],
			where: { usuarioId: { in: ids } },
			_count: { _all: true },
		}),
		prisma.actividadCompletada.groupBy({
			by: ["usuarioId"],
			where: { usuarioId: { in: ids } },
			_count: { _all: true },
		}),
		prisma.intentoReto.groupBy({
			by: ["usuarioId", "esCorrecto"],
			where: { usuarioId: { in: ids } },
			_count: { _all: true },
			_sum: { puntosObtenidos: true },
		}),
		// Una fila por (estudiante, reto) con al menos un acierto: contarlas da los retos distintos acertados.
		prisma.intentoReto.groupBy({
			by: ["usuarioId", "retoId"],
			where: { usuarioId: { in: ids }, esCorrecto: true },
		}),
	]);

	for (const fila of progresos) {
		if (fila.estado === "completada") {
			resumen[fila.usuarioId].misiones_completadas += fila._count._all;
		} else if (fila.estado === "en_progreso") {
			resumen[fila.usuarioId].misiones_en_progreso += fila._count._all;
		}
	}

	for (const fila of historias) {
		resumen[fila.usuarioId].historias_completadas = fila._count._all;
	}

	for (const fila of actividades) {
		resumen[fila.usuarioId].actividades_completadas = fila._count._all;
	}

	for (const fila of intentos) {
		const estudiante = resumen[fila.usuarioId];
		estudiante.intentos_totales += fila._count._all;
		estudiante.puntos_obtenidos_retos += fila._sum.puntosObtenidos ?? 0;
		if (fila.esCorrecto) {
			estudiante.intentos_correctos += fila._count._all;
		}
	}

	for (const fila of aciertosPorReto) {
		resumen[fila.usuarioId].retos_acertados += 1;
	}

	return resumen;
}
