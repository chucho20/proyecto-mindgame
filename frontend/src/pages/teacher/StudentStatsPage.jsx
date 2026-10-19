import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as teacherApi from "../../api/teacher.api.js";
import AdminStatCard from "../../components/admin/AdminStatCard/AdminStatCard.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import StatBar from "../../components/teacher/StatBar/StatBar.jsx";
import { avatarEmoji } from "../../constants/avatars.js";
import {
	formatearFecha,
	formatearNumero,
	formatearPorcentaje,
	SIN_DATO,
	tonoDeAcierto,
} from "../../utils/estadisticas.js";
import "./TeacherPages.css";
import "./StudentStatsPage.css";

/**
 * Progreso individual de un estudiante de los grupos del docente (RF-023):
 * tarjetas de avance, desempeño en retos y misiones completadas. Si el
 * estudiante no está en ningún grupo del docente (o lo retiró) el backend
 * responde 404 y se muestra como "no encontrado".
 */
function StudentStatsPage() {
	const { estudianteId } = useParams();
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
				const result = await teacherApi.getStudentStats(estudianteId);

				if (!cancelled) {
					setData(result);
				}
			} catch (err) {
				if (!cancelled) {
					if (err.response?.status === 404) {
						setNotFound(true);
					} else {
						setError(err.response?.data?.message || "No pudimos cargar las estadísticas del estudiante.");
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
	}, [estudianteId, reloadKey]);

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
					<strong>No encontramos a este estudiante entre tus grupos.</strong>
					Puede que ya no esté en ninguno de tus grupos o que no exista.
				</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="teacher-page">
				<Link to="/docente/grupos" className="teacher-page__back">
					← Mis grupos
				</Link>
				<p className="teacher-page__status teacher-page__status--error" role="alert">
					{error || "No pudimos cargar las estadísticas del estudiante."}{" "}
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

	const { estudiante, grupos, estadisticas, misiones_completadas_detalle: misiones } = data;
	const { retos } = estadisticas;
	const detalles = [
		estudiante.nombre_usuario ? `@${estudiante.nombre_usuario}` : null,
		estudiante.grado_curso,
	].filter(Boolean);

	return (
		<div className="teacher-page">
			<Link to="/docente/grupos" className="teacher-page__back">
				← Mis grupos
			</Link>

			<PageHeader
				title={`${avatarEmoji(estudiante.avatar)} ${estudiante.nombre_completo}`}
				description={detalles.length > 0 ? detalles.join(" · ") : "Progreso individual del estudiante."}
			/>

			<div className="teacher-page__meta">
				<span>{grupos.length === 1 ? "Grupo:" : "Grupos:"}</span>
				<ul className="teacher-page__chips">
					{grupos.map((grupo) => (
						<li key={grupo.id}>
							<Link to={`/docente/grupos/${grupo.id}`} className="teacher-page__chip">
								{grupo.nombre}
							</Link>
						</li>
					))}
				</ul>
			</div>

			<section className="stat-cards-grid teacher-page__stats" aria-label="Resumen del estudiante">
				<AdminStatCard
					label="Puntos"
					value={formatearNumero(estadisticas.puntos_totales)}
					icon="⭐"
					accent="accent"
				/>
				<AdminStatCard
					label="Nivel actual"
					value={formatearNumero(estadisticas.nivel_actual)}
					icon="📈"
					accent="success"
				/>
				<AdminStatCard
					label="Misiones completadas"
					value={formatearNumero(estadisticas.misiones_completadas)}
					icon="🗺️"
					accent="primary"
				/>
				<AdminStatCard
					label="Misiones en progreso"
					value={formatearNumero(estadisticas.misiones_en_progreso)}
					icon="⏳"
					accent="primary"
				/>
				<AdminStatCard
					label="Historias completadas"
					value={formatearNumero(estadisticas.historias_completadas)}
					icon="📖"
					accent="accent"
				/>
				<AdminStatCard
					label="Actividades completadas"
					value={formatearNumero(estadisticas.actividades_completadas)}
					icon="🎲"
					accent="error"
				/>
			</section>

			<section className="teacher-page__section student-stats__retos" aria-label="Desempeño en retos">
				<h2 className="teacher-page__section-title">Retos</h2>

				<div className="student-stats__acierto">
					<span className="student-stats__acierto-label">% de acierto</span>
					<StatBar
						value={retos.porcentaje_acierto}
						label="Porcentaje de acierto en retos"
						valueLabel={formatearPorcentaje(retos.porcentaje_acierto)}
						tone={tonoDeAcierto(retos.porcentaje_acierto)}
					/>
				</div>
				{retos.intentos_totales === 0 ? (
					<p className="teacher-page__section-description">Todavía no intentó ningún reto.</p>
				) : null}

				<dl className="student-stats__datos">
					<div>
						<dt>Intentos totales</dt>
						<dd>{formatearNumero(retos.intentos_totales)}</dd>
					</div>
					<div>
						<dt>Intentos correctos</dt>
						<dd>{formatearNumero(retos.intentos_correctos)}</dd>
					</div>
					<div>
						<dt>Intentos incorrectos</dt>
						<dd>{formatearNumero(retos.intentos_incorrectos)}</dd>
					</div>
					<div>
						<dt>Retos acertados</dt>
						<dd>{formatearNumero(retos.retos_acertados)}</dd>
					</div>
					<div>
						<dt>Puntos obtenidos en retos</dt>
						<dd>{formatearNumero(retos.puntos_obtenidos)}</dd>
					</div>
				</dl>
			</section>

			<section className="teacher-page__section" aria-label="Misiones completadas">
				<h2 className="teacher-page__section-title">Misiones completadas</h2>

				{misiones.length === 0 ? (
					<p className="teacher-page__empty">Todavía no completó ninguna misión.</p>
				) : (
					<ul className="student-stats__misiones">
						{misiones.map((mision) => (
							<li key={mision.id} className="student-stats__mision">
								<span className="student-stats__mision-icon" aria-hidden="true">
									✓
								</span>
								<div className="student-stats__mision-body">
									<p className="student-stats__mision-title">{mision.titulo}</p>
									<p className="teacher-page__muted">{mision.categoria || SIN_DATO}</p>
								</div>
								<span className="teacher-page__muted">{formatearFecha(mision.completada_en)}</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

export default StudentStatsPage;
