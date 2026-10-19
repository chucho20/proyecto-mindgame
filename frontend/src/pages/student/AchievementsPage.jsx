import { useEffect, useState } from "react";

import * as achievementsApi from "../../api/achievements.api.js";
import AchievementCard from "../../components/student/AchievementCard/AchievementCard.jsx";
import ProgressionSection from "../../components/student/ProgressionSection/ProgressionSection.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { describirCondicion } from "../../utils/progresion.js";
import "./AchievementsPage.css";

/**
 * Logros del estudiante (RF-015): los que ya obtuvo y los que le faltan,
 * con la condición de cada pendiente. Lee GET /api/logros.
 */
function AchievementsPage() {
	const [logros, setLogros] = useState({ obtenidos: [], pendientes: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Cambiar `intento` vuelve a disparar la carga (botón "Reintentar").
	const [intento, setIntento] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function cargarLogros() {
			setLoading(true);
			setError("");

			try {
				const data = await achievementsApi.getAchievements();

				if (!cancelled) {
					setLogros({
						obtenidos: Array.isArray(data?.obtenidos) ? data.obtenidos : [],
						pendientes: Array.isArray(data?.pendientes) ? data.pendientes : [],
					});
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar tus logros.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarLogros();

		return () => {
			cancelled = true;
		};
	}, [intento]);

	const sinLogros = logros.obtenidos.length === 0 && logros.pendientes.length === 0;

	return (
		<div className="achievements-page">
			<PageHeader
				title="Logros"
				description="Mirá los logros que ya conseguiste y los que podés desbloquear."
			/>

			{loading ? (
				<p className="achievements-page__status" role="status">
					Cargando tus logros...
				</p>
			) : null}

			{error ? (
				<div className="achievements-page__status achievements-page__status--error" role="alert">
					<p>{error}</p>
					<button
						type="button"
						className="achievements-page__retry"
						onClick={() => setIntento((actual) => actual + 1)}
					>
						Reintentar
					</button>
				</div>
			) : null}

			{!loading && !error && sinLogros ? (
				<p className="achievements-page__status">Todavía no hay logros disponibles.</p>
			) : null}

			{!loading && !error && !sinLogros ? (
				<>
					<ProgressionSection
						title="Obtenidos"
						description="Estos logros ya forman parte de tu progreso."
						count={logros.obtenidos.length}
						emptyIcon="🏆"
						emptyTitle="Aún no obtuviste logros"
						emptyText="Completá misiones y retos para empezar a desbloquearlos."
					>
						{logros.obtenidos.map((logro) => (
							<AchievementCard
								key={logro.id}
								nombre={logro.nombre}
								descripcion={logro.descripcion}
								icono={logro.icono || undefined}
								obtenido
							/>
						))}
					</ProgressionSection>

					<ProgressionSection
						title="Por conseguir"
						description="Seguí jugando para desbloquear estos logros."
						count={logros.pendientes.length}
						emptyIcon="🎉"
						emptyTitle="¡Desbloqueaste todos los logros!"
						emptyText="Seguí participando en MindGame para seguir aprendiendo."
					>
						{logros.pendientes.map((logro) => (
							<AchievementCard
								key={logro.id}
								nombre={logro.nombre}
								descripcion={logro.descripcion}
								icono={logro.icono || undefined}
								condicion={describirCondicion(logro.condicion_tipo, logro.condicion_valor)}
							/>
						))}
					</ProgressionSection>
				</>
			) : null}
		</div>
	);
}

export default AchievementsPage;
