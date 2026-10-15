
import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import AdminStatCard from "../../components/admin/AdminStatCard/AdminStatCard.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./AdminDashboardPage.css";

/**
 * Dashboard administrativo de MindGame.
 * RF-026: incluye estadísticas de progresión.
 */
function AdminDashboardPage() {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function cargarStats() {
			setLoading(true);
			setError("");

			try {
				const respuesta = await adminApi.getStats();
				const data = respuesta?.stats ?? respuesta;

				if (!cancelled) {
					setStats(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err.response?.data?.message ||
							"No pudimos cargar las estadísticas."
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarStats();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="admin-dashboard-page">
			<PageHeader
				title="Dashboard"
				description="Resumen del contenido educativo y la progresión de MindGame."
			/>

			{loading && (
				<p className="admin-dashboard-page__status">
					Cargando estadísticas...
				</p>
			)}

			{error && (
				<p className="admin-dashboard-page__status admin-dashboard-page__status--error">
					{error}
				</p>
			)}

			{!loading && !error && stats && (
				<div className="stat-cards-grid">
					<AdminStatCard
						label="Misiones"
						value={stats.misiones ?? 0}
						icon="🗺️"
						accent="primary"
					/>

					<AdminStatCard
						label="Historias"
						value={stats.historias ?? 0}
						icon="📖"
						accent="success"
					/>

					<AdminStatCard
						label="Retos"
						value={stats.retos ?? 0}
						icon="🧩"
						accent="accent"
					/>

					<AdminStatCard
						label="Actividades"
						value={stats.actividades ?? 0}
						icon="🎲"
						accent="error"
					/>

					<AdminStatCard
						label="Recompensas activas"
						value={stats.recompensasActivas ?? 0}
						icon="🏆"
						accent="success"
					/>

					<AdminStatCard
						label="Logros activos"
						value={stats.logrosActivos ?? 0}
						icon="🎖️"
						accent="primary"
					/>
				</div>
			)}
		</div>
	);
}

export default AdminDashboardPage;
