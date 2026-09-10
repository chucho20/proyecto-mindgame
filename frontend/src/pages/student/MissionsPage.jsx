import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as missionsApi from "../../api/missions.api.js";
import MissionCard from "../../components/student/MissionCard/MissionCard.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./MissionsPage.css";

/**
 * Grilla de exploración de misiones (RF-007). Diferencia disponible / en
 * progreso / completada usando el `progreso` que ya viene resuelto desde
 * mision.service.listar (join contra progreso_misiones del usuario logueado).
 */
function MissionsPage() {
	const navigate = useNavigate();
	const [misiones, setMisiones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function cargarMisiones() {
			setLoading(true);
			setError("");

			try {
				const { misiones: data } = await missionsApi.listMissions();
				if (!cancelled) {
					setMisiones(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar las misiones.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarMisiones();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="missions-page">
			<PageHeader
				title="Misiones"
				description="Explorá misiones históricas: leé la historia, respondé los retos y completá las actividades."
			/>

			{loading ? <p className="missions-page__status">Cargando misiones...</p> : null}
			{error ? <p className="missions-page__status missions-page__status--error">{error}</p> : null}

			{!loading && !error && misiones.length === 0 ? (
				<p className="missions-page__status">Todavía no hay misiones disponibles.</p>
			) : null}

			<div className="cards-grid">
				{misiones.map((mision) => (
					<MissionCard
						key={mision.id}
						mision={mision}
						onClick={() => navigate(`/estudiante/misiones/${mision.id}`)}
					/>
				))}
			</div>
		</div>
	);
}

export default MissionsPage;
