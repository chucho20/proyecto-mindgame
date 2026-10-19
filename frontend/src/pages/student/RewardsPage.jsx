import { useEffect, useState } from "react";

import * as rewardsApi from "../../api/rewards.api.js";
import RewardCard from "../../components/student/RewardCard/RewardCard.jsx";
import ProgressionSection from "../../components/student/ProgressionSection/ProgressionSection.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { describirCondicion } from "../../utils/progresion.js";
import "./RewardsPage.css";

/**
 * Recompensas del estudiante (RF-015): las que ya ganó y las que le faltan,
 * con la condición de cada pendiente. Lee GET /api/recompensas.
 */
function RewardsPage() {
	const [recompensas, setRecompensas] = useState({ obtenidas: [], pendientes: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Cambiar `intento` vuelve a disparar la carga (botón "Reintentar").
	const [intento, setIntento] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function cargarRecompensas() {
			setLoading(true);
			setError("");

			try {
				const data = await rewardsApi.getRewards();

				if (!cancelled) {
					setRecompensas({
						obtenidas: Array.isArray(data?.obtenidas) ? data.obtenidas : [],
						pendientes: Array.isArray(data?.pendientes) ? data.pendientes : [],
					});
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar tus recompensas.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarRecompensas();

		return () => {
			cancelled = true;
		};
	}, [intento]);

	const sinRecompensas = recompensas.obtenidas.length === 0 && recompensas.pendientes.length === 0;

	return (
		<div className="rewards-page">
			<PageHeader
				title="Recompensas"
				description="Mirá las recompensas que ya ganaste y las que podés conseguir."
			/>

			{loading ? (
				<p className="rewards-page__status" role="status">
					Cargando tus recompensas...
				</p>
			) : null}

			{error ? (
				<div className="rewards-page__status rewards-page__status--error" role="alert">
					<p>{error}</p>
					<button
						type="button"
						className="rewards-page__retry"
						onClick={() => setIntento((actual) => actual + 1)}
					>
						Reintentar
					</button>
				</div>
			) : null}

			{!loading && !error && sinRecompensas ? (
				<p className="rewards-page__status">Todavía no hay recompensas disponibles.</p>
			) : null}

			{!loading && !error && !sinRecompensas ? (
				<>
					<ProgressionSection
						title="Obtenidas"
						description="Estas recompensas ya son tuyas."
						count={recompensas.obtenidas.length}
						emptyIcon="🎁"
						emptyTitle="Aún no ganaste recompensas"
						emptyText="Sumá puntos y subí de nivel para empezar a ganarlas."
					>
						{recompensas.obtenidas.map((recompensa) => (
							<RewardCard
								key={recompensa.id}
								nombre={recompensa.nombre}
								descripcion={recompensa.descripcion}
								icono={recompensa.icono}
								obtenida
								obtenidaEn={recompensa.obtenida_en}
							/>
						))}
					</ProgressionSection>

					<ProgressionSection
						title="Por conseguir"
						description="Seguí jugando para ganar estas recompensas."
						count={recompensas.pendientes.length}
						emptyIcon="🎉"
						emptyTitle="¡Ganaste todas las recompensas!"
						emptyText="Seguí participando en MindGame para seguir aprendiendo."
					>
						{recompensas.pendientes.map((recompensa) => (
							<RewardCard
								key={recompensa.id}
								nombre={recompensa.nombre}
								descripcion={recompensa.descripcion}
								icono={recompensa.icono}
								condicion={describirCondicion(recompensa.condicion_tipo, recompensa.condicion_valor)}
							/>
						))}
					</ProgressionSection>
				</>
			) : null}
		</div>
	);
}

export default RewardsPage;
