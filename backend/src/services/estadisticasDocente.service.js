import AppError from "../utils/AppError.js";
import * as grupoEstudianteRepository from "../repositories/grupoEstudiante.repository.js";
import * as progresoMisionRepository from "../repositories/progresoMision.repository.js";
import * as estadisticasEstudianteRepository from "../repositories/estadisticasEstudiante.repository.js";
import { obtenerGrupoPropio } from "./grupo.service.js";

/**
 * Estadísticas que ve el docente (RF-023). Siempre se limitan a estudiantes de
 * grupos del docente autenticado, y se calculan con consultas agregadas: el costo
 * no crece con la cantidad de estudiantes.
 *
 * Los promedios y porcentajes sin denominador (grupo sin estudiantes, estudiante
 * sin intentos) se informan como `null` en vez de 0, para no confundir "sin datos"
 * con "cero aciertos"; nunca se divide por cero.
 */

function redondear(valor) {
	return Math.round(valor * 100) / 100;
}

function promedio(total, cantidad) {
	return cantidad > 0 ? redondear(total / cantidad) : null;
}

function porcentajeAcierto(correctos, totales) {
	return totales > 0 ? redondear((correctos / totales) * 100) : null;
}

// Estadísticas de UN estudiante a partir de sus datos de usuario y sus cuentas de actividad.
function armarEstadisticas(miembro, cuentas) {
	return {
		puntos_totales: miembro.puntos_totales,
		nivel_actual: miembro.nivel_actual,
		misiones_completadas: cuentas.misiones_completadas,
		misiones_en_progreso: cuentas.misiones_en_progreso,
		historias_completadas: cuentas.historias_completadas,
		actividades_completadas: cuentas.actividades_completadas,
		retos: {
			intentos_totales: cuentas.intentos_totales,
			intentos_correctos: cuentas.intentos_correctos,
			intentos_incorrectos: cuentas.intentos_totales - cuentas.intentos_correctos,
			retos_acertados: cuentas.retos_acertados,
			porcentaje_acierto: porcentajeAcierto(cuentas.intentos_correctos, cuentas.intentos_totales),
			puntos_obtenidos: cuentas.puntos_obtenidos_retos,
		},
	};
}

function aEstudiante(miembro) {
	return {
		id: miembro.id,
		nombre_completo: miembro.nombre_completo,
		nombre_usuario: miembro.nombre_usuario,
		grado_curso: miembro.grado_curso,
		avatar: miembro.avatar,
	};
}

/**
 * Vista agregada del progreso de un grupo del docente (RF-023): un resumen del
 * grupo y las estadísticas de cada estudiante.
 */
export async function estadisticasDelGrupo(docenteId, grupoId) {
	const grupo = await obtenerGrupoPropio(docenteId, grupoId);
	const miembros = await grupoEstudianteRepository.findEstudiantesByGrupo(grupo.id);
	const cuentas = await estadisticasEstudianteRepository.resumirPorEstudiantes(
		miembros.map((miembro) => miembro.id),
	);

	const estudiantes = miembros.map((miembro) => ({
		...aEstudiante(miembro),
		estadisticas: armarEstadisticas(miembro, cuentas[miembro.id]),
	}));

	const sumar = (extraer) => estudiantes.reduce((total, estudiante) => total + extraer(estudiante), 0);
	const totalEstudiantes = estudiantes.length;
	const puntosTotales = sumar((e) => e.estadisticas.puntos_totales);
	const misionesCompletadas = sumar((e) => e.estadisticas.misiones_completadas);
	const intentosTotales = sumar((e) => e.estadisticas.retos.intentos_totales);
	const intentosCorrectos = sumar((e) => e.estadisticas.retos.intentos_correctos);

	return {
		grupo: { id: grupo.id, nombre: grupo.nombre, codigo: grupo.codigo, created_at: grupo.created_at },
		resumen: {
			total_estudiantes: totalEstudiantes,
			puntos_totales: puntosTotales,
			puntos_promedio: promedio(puntosTotales, totalEstudiantes),
			nivel_promedio: promedio(
				sumar((e) => e.estadisticas.nivel_actual),
				totalEstudiantes,
			),
			misiones_completadas_total: misionesCompletadas,
			misiones_completadas_promedio: promedio(misionesCompletadas, totalEstudiantes),
			historias_completadas_total: sumar((e) => e.estadisticas.historias_completadas),
			actividades_completadas_total: sumar((e) => e.estadisticas.actividades_completadas),
			retos: {
				intentos_totales: intentosTotales,
				intentos_correctos: intentosCorrectos,
				intentos_incorrectos: intentosTotales - intentosCorrectos,
				porcentaje_acierto: porcentajeAcierto(intentosCorrectos, intentosTotales),
			},
		},
		estudiantes,
	};
}

/**
 * Progreso individual de un estudiante (RF-023). Solo se puede consultar si el
 * estudiante está en algún grupo del docente: un estudiante ajeno y uno
 * inexistente responden igual (404).
 */
export async function estadisticasDelEstudiante(docenteId, estudianteId) {
	const encontrado = await grupoEstudianteRepository.findEstudianteDeDocente(estudianteId, docenteId);

	if (!encontrado) {
		throw new AppError("Estudiante no encontrado.", 404);
	}

	const { estudiante: miembro, grupos } = encontrado;
	const [cuentas, misionesCompletadas] = await Promise.all([
		estadisticasEstudianteRepository.resumirPorEstudiantes([miembro.id]),
		progresoMisionRepository.findCompletadasConMision(miembro.id),
	]);

	return {
		estudiante: aEstudiante(miembro),
		grupos,
		estadisticas: armarEstadisticas(miembro, cuentas[miembro.id]),
		misiones_completadas: misionesCompletadas.map((mision) => ({
			id: mision.mision_id,
			titulo: mision.titulo,
			categoria: mision.categoria,
			completada_en: mision.completada_en,
		})),
	};
}
