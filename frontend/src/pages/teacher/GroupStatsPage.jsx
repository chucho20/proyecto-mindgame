import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as teacherApi from "../../api/teacher.api.js";
import AdminStatCard from "../../components/admin/AdminStatCard/AdminStatCard.jsx";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import StatBar from "../../components/teacher/StatBar/StatBar.jsx";
import { avatarEmoji } from "../../constants/avatars.js";
import { formatearNumero, formatearPorcentaje, tonoDeAcierto } from "../../utils/estadisticas.js";
import "./TeacherPages.css";

/**
 * Estadísticas agregadas de un grupo del docente (RF-023): tarjetas de resumen y
 * una fila por estudiante con barras simples de nivel y % de acierto. El backend
 * informa `null` en promedios y porcentajes sin datos; se muestran como "—".
 */
function GroupStatsPage() {
	const { grupoId } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notFound, setNotFound] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function cargarEstadisticas() {
			setLoading(true);
			setError("");
			setNotFound(false);
			setData(null);

			try {
				const result = await teacherApi.getGroupStats(grupoId);

				if (!cancelled) {
					setData(result);
				}
			} catch (err) {
				if (!cancelled) {
					if (err.response?.status === 404) {
						setNotFound(true);
					} else {
						setError(err.response?.data?.message || "No pudimos cargar las estadísticas del grupo.");
					}
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarEstadisticas();

		return () => {
			cancelled = true;
		};
	}, [grupoId, reloadKey]);

	if (loading) {
		return (
			<div className="teacher-page">
				<p className="teacher-page__status">Cargando las estadísticas...</p>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="teacher-page">
				<Link to="/docente/grupos" className="teacher-page__back">
					← Mis grupos
				</Link>
				<p className="teacher-page__empty">
					<strong>No encontramos este grupo.</strong>
					Puede que no exista o que no sea uno de tus grupos.
				</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="teacher-page">
				<Link to={`/docente/grupos/${grupoId}`} className="teacher-page__back">
					← Volver al grupo
				</Link>
				<p className="teacher-page__status teacher-page__status--error" role="alert">
					{error || "No pudimos cargar las estadísticas del grupo."}{" "}
					<button
						type="button"
						className="teacher-page__retry"
						onClick={() => setReloadKey((key) => key + 1)}
					>
						Reintentar
					</button>
				</p>
			</div>
		);
	}

	const { grupo, resumen, estudiantes } = data;
	const nivelMaximo = Math.max(
		1,
		...estudiantes.map((estudiante) => estudiante.estadisticas.nivel_actual ?? 0),
	);

	const columns = [
		{
			key: "nombre_completo",
			label: "Estudiante",
			render: (row) => (
				<Link to={`/docente/estudiantes/${row.id}/estadisticas`} className="teacher-page__student-link">
					<span aria-hidden="true">{avatarEmoji(row.avatar)}</span>
					{row.nombre_completo}
				</Link>
			),
		},
		{
			key: "nivel",
			label: "Nivel",
			render: (row) => (
				<StatBar
					value={row.estadisticas.nivel_actual}
					max={nivelMaximo}
					label={`Nivel de ${row.nombre_completo}`}
					valueLabel={`Nivel ${formatearNumero(row.estadisticas.nivel_actual)}`}
				/>
			),
		},
		{ key: "puntos", label: "Puntos", render: (row) => formatearNumero(row.estadisticas.puntos_totales) },
		{
			key: "misiones",
			label: "Misiones",
			render: (row) => formatearNumero(row.estadisticas.misiones_completadas),
		},
		{
			key: "actividades",
			label: "Actividades",
			render: (row) => formatearNumero(row.estadisticas.actividades_completadas),
		},
		{
			key: "intentos",
			label: "Aciertos / intentos",
			render: (row) =>
				`${formatearNumero(row.estadisticas.retos.intentos_correctos)} / ${formatearNumero(row.estadisticas.retos.intentos_totales)}`,
		},
		{
			key: "acierto",
			label: "% de acierto",
			render: (row) => (
				<StatBar
					value={row.estadisticas.retos.porcentaje_acierto}
					label={`Porcentaje de acierto de ${row.nombre_completo}`}
					valueLabel={formatearPorcentaje(row.estadisticas.retos.porcentaje_acierto)}
					tone={tonoDeAcierto(row.estadisticas.retos.porcentaje_acierto)}
				/>
			),
		},
	];

	return (
		<div className="teacher-page">
			<Link to={`/docente/grupos/${grupo.id}`} className="teacher-page__back">
				← Volver al grupo
			</Link>

			<PageHeader
				title={`Estadísticas: ${grupo.nombre}`}
				description="Resumen del progreso de los estudiantes que forman parte del grupo."
			/>

			<section className="stat-cards-grid teacher-page__stats" aria-label="Resumen del grupo">
				<AdminStatCard
					label="Estudiantes"
					value={formatearNumero(resumen.total_estudiantes)}
					icon="👥"
					accent="primary"
				/>
				<AdminStatCard
					label="Puntos promedio"
					value={formatearNumero(resumen.puntos_promedio)}
					icon="⭐"
					accent="accent"
				/>
				<AdminStatCard
					label="Nivel promedio"
					value={formatearNumero(resumen.nivel_promedio)}
					icon="📈"
					accent="success"
				/>
				<AdminStatCard
					label="% de acierto en retos"
					value={formatearPorcentaje(resumen.retos.porcentaje_acierto)}
					icon="🎯"
					accent="success"
				/>
				<AdminStatCard
					label={`Misiones completadas (prom. ${formatearNumero(resumen.misiones_completadas_promedio)})`}
					value={formatearNumero(resumen.misiones_completadas_total)}
					icon="🗺️"
					accent="primary"
				/>
				<AdminStatCard
					label="Historias completadas"
					value={formatearNumero(resumen.historias_completadas_total)}
					icon="📖"
					accent="accent"
				/>
				<AdminStatCard
					label="Actividades completadas"
					value={formatearNumero(resumen.actividades_completadas_total)}
					icon="🎲"
					accent="error"
				/>
				<AdminStatCard
					label={`Intentos de retos (${formatearNumero(resumen.retos.intentos_correctos)} correctos)`}
					value={formatearNumero(resumen.retos.intentos_totales)}
					icon="🧩"
					accent="primary"
				/>
			</section>

			<section className="teacher-page__section" aria-label="Progreso por estudiante">
				<h2 className="teacher-page__section-title">Progreso por estudiante</h2>
				<p className="teacher-page__section-description">
					La barra de nivel se compara con el nivel más alto del grupo. Entrá al nombre de un estudiante para
					ver su detalle.
				</p>
				<DataTable
					columns={columns}
					rows={estudiantes}
					emptyMessage="Todavía no hay estudiantes en este grupo, así que no hay estadísticas para mostrar."
				/>
			</section>
		</div>
	);
}

export default GroupStatsPage;
