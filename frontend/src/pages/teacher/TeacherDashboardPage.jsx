import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import * as teacherApi from "../../api/teacher.api.js";
import AdminStatCard from "../../components/admin/AdminStatCard/AdminStatCard.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { useAuth } from "../../context/AuthContext.js";
import { formatearNumero } from "../../utils/estadisticas.js";
import "./TeacherPages.css";
import "./TeacherDashboardPage.css";

const MAX_GRUPOS_RECIENTES = 5;

/**
 * Inicio del docente (RF-021/022): saludo, cantidad de grupos y de estudiantes
 * (GET /docente/grupos) y acceso rápido a los grupos más recientes. A propósito
 * no muestra métricas de progreso general: esas viven en las estadísticas de
 * cada grupo (RF-023).
 */
function TeacherDashboardPage() {
	const { user } = useAuth();
	const [grupos, setGrupos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function cargarGrupos() {
			setLoading(true);
			setError("");

			try {
				const { grupos: data } = await teacherApi.listGroups();

				if (!cancelled) {
					setGrupos(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar el resumen de tus grupos.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarGrupos();

		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	const totalEstudiantes = grupos.reduce((total, grupo) => total + (grupo.total_estudiantes ?? 0), 0);
	const nombre = user?.nombre_completo?.split(" ")[0];

	return (
		<div className="teacher-page teacher-dashboard">
			<PageHeader
				title={nombre ? `¡Hola, ${nombre}!` : "¡Hola!"}
				description="Acá podés ver un resumen de tus grupos y acceder al progreso de tus estudiantes."
				actions={
					<Link to="/docente/grupos" className="teacher-page__primary">
						Ir a mis grupos
					</Link>
				}
			/>

			{loading ? <p className="teacher-page__status">Cargando el resumen...</p> : null}
			{error ? (
				<p className="teacher-page__status teacher-page__status--error" role="alert">
					{error}{" "}
					<button
						type="button"
						className="teacher-page__retry"
						onClick={() => setReloadKey((key) => key + 1)}
					>
						Reintentar
					</button>
				</p>
			) : null}

			{!loading && !error ? (
				<>
					<section className="stat-cards-grid teacher-dashboard__cards" aria-label="Resumen">
						<AdminStatCard label="Grupos" value={formatearNumero(grupos.length)} icon="👥" accent="primary" />
						<AdminStatCard
							label="Inscripciones en tus grupos"
							value={formatearNumero(totalEstudiantes)}
							icon="🎓"
							accent="success"
						/>
					</section>

					<section className="teacher-page__section" aria-label="Grupos recientes">
						<h2 className="teacher-page__section-title">Tus grupos</h2>

						{grupos.length === 0 ? (
							<p className="teacher-page__empty">
								<strong>Todavía no tenés grupos.</strong>
								<Link to="/docente/grupos" className="teacher-page__link-button">
									Creá el primero
								</Link>{" "}
								y compartí su código con tus estudiantes.
							</p>
						) : (
							<ul className="teacher-dashboard__groups">
								{grupos.slice(0, MAX_GRUPOS_RECIENTES).map((grupo) => (
									<li key={grupo.id} className="teacher-dashboard__group">
										<Link to={`/docente/grupos/${grupo.id}`} className="teacher-page__student-link">
											{grupo.nombre}
										</Link>
										<span className="teacher-page__muted">
											{grupo.total_estudiantes === 1
												? "1 estudiante"
												: `${grupo.total_estudiantes ?? 0} estudiantes`}
										</span>
										<Link to={`/docente/grupos/${grupo.id}/estadisticas`} className="teacher-page__action">
											Estadísticas
										</Link>
									</li>
								))}
							</ul>
						)}
					</section>
				</>
			) : null}
		</div>
	);
}

export default TeacherDashboardPage;
