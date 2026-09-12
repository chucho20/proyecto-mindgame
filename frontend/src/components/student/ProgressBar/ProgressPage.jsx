import { useEffect, useMemo, useState } from "react";

import * as progressApi from "../../api/progress.api.js";
import XpBar from "../../components/student/XpBar/XpBar.jsx";
import LevelProgress from "../../components/student/LevelProgress/LevelProgress.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./ProgressPage.css";

function ProgressPage() {
	const [progress, setProgress] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function cargarProgreso() {
			setLoading(true);
			setError("");

			try {
				const data = await progressApi.getProgress();

				if (!cancelled) {
					setProgress(data?.progreso ?? data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err.response?.data?.message ||
							"No pudimos cargar tu progreso.",
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarProgreso();

		return () => {
			cancelled = true;
		};
	}, []);

	const datos = useMemo(() => {
		if (!progress) {
			return null;
		}

		const nivel = Number(
			progress.nivel ??
				progress.level ??
				progress.nivel_actual ??
				1,
		);

		const puntos = Number(
			progress.puntos ??
				progress.xp ??
				progress.experiencia ??
				progress.currentXp ??
				0,
		);

		const siguienteNivel = Number(
			progress.siguiente_nivel ??
				progress.nextLevel ??
				progress.nivel_siguiente ??
				nivel + 1,
		);

		const puntosSiguienteNivel = Number(
			progress.puntos_siguiente_nivel ??
				progress.nextLevelXp ??
				progress.xp_siguiente_nivel ??
				0,
		);

		const misiones = Array.isArray(progress.misiones_completadas)
			? progress.misiones_completadas
			: Array.isArray(progress.misionesCompletadas)
				? progress.misionesCompletadas
				: Array.isArray(progress.misiones)
					? progress.misiones.filter(
							(mision) =>
								mision.completada === true ||
								mision.progreso === "completada" ||
								mision.estado === "completada",
						)
					: [];

		return {
			nivel,
			puntos,
			siguienteNivel,
			puntosSiguienteNivel,
			misiones,
		};
	}, [progress]);

	if (loading) {
		return (
			<p className="progress-page__status">
				Cargando tu progreso...
			</p>
		);
	}

	if (error || !datos) {
		return (
			<p className="progress-page__status progress-page__status--error">
				{error || "No pudimos encontrar tu progreso."}
			</p>
		);
	}

	return (
		<div className="progress-page">
			<PageHeader
				title="Mi progreso"
				description="Consulta tu nivel, tus puntos y las misiones que has completado."
			/>

			<section className="progress-page__summary" aria-label="Resumen de progreso">
				<article className="progress-page__stat">
					<span className="progress-page__stat-label">
						Nivel actual
					</span>
					<strong className="progress-page__stat-value">
						{datos.nivel}
					</strong>
				</article>

				<article className="progress-page__stat">
					<span className="progress-page__stat-label">
						Puntos
					</span>
					<strong className="progress-page__stat-value">
						{datos.puntos}
					</strong>
				</article>

				<article className="progress-page__stat">
					<span className="progress-page__stat-label">
						Misiones completadas
					</span>
					<strong className="progress-page__stat-value">
						{datos.misiones.length}
					</strong>
				</article>
			</section>

			<section className="progress-page__section">
				<h2 className="progress-page__section-title">
					Avance de nivel
				</h2>

				<XpBar
					level={datos.nivel}
					currentXp={datos.puntos}
					nextLevelXp={datos.puntosSiguienteNivel}
				/>

				<LevelProgress
					level={datos.nivel}
					nextLevel={datos.siguienteNivel}
					currentXp={datos.puntos}
					nextLevelXp={datos.puntosSiguienteNivel}
				/>
			</section>

			<section className="progress-page__section">
				<div className="progress-page__section-heading">
					<div>
						<h2 className="progress-page__section-title">
							Misiones completadas
						</h2>
						<p className="progress-page__section-description">
							Estas son las misiones que ya has terminado.
						</p>
					</div>

					<span className="progress-page__mission-count">
						{datos.misiones.length}
					</span>
				</div>

				{datos.misiones.length === 0 ? (
					<div className="progress-page__empty">
						<p>Aún no has completado ninguna misión.</p>
						<span>
							Completa una misión para comenzar a registrar tu avance.
						</span>
					</div>
				) : (
					<ul className="progress-page__missions">
						{datos.misiones.map((mision, index) => (
							<li
								key={mision.id ?? mision.mision_id ?? index}
								className="progress-page__mission"
							>
								<span
									className="progress-page__mission-icon"
									aria-hidden="true"
								>
									✓
								</span>

								<div className="progress-page__mission-content">
									<h3>
										{mision.titulo ??
											mision.nombre ??
											`Misión ${mision.id ?? index + 1}`}
									</h3>

									{mision.descripcion ? (
										<p>{mision.descripcion}</p>
									) : null}
								</div>

								<span className="progress-page__mission-status">
									Completada
								</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

export default ProgressPage;