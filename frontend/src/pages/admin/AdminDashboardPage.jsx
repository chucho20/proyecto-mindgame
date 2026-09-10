import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import AdminStatCard from "../../components/admin/AdminStatCard/AdminStatCard.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./AdminDashboardPage.css";

/**
 * Landing del panel admin (RF-024/025): conteos reales de GET /admin/stats.
 * A propósito no muestra métricas que este sprint no modela todavía
 * (usuarios, convivencia, progresión) — esas secciones siguen deshabilitadas
 * en el sidebar hasta que tengan datos reales detrás.
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
				const { stats: data } = await adminApi.getStats();
				if (!cancelled) {
					setStats(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar las estadísticas.");
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
			<PageHeader title="Dashboard" description="Resumen del contenido educativo cargado en MindGame." />

			{loading ? <p className="admin-dashboard-page__status">Cargando estadísticas...</p> : null}
			{error ? (
				<p className="admin-dashboard-page__status admin-dashboard-page__status--error">{error}</p>
			) : null}

			{!loading && !error && stats ? (
				<div className="stat-cards-grid">
					<AdminStatCard label="Misiones" value={stats.misiones} icon="🗺️" accent="primary" />
					<AdminStatCard label="Historias" value={stats.historias} icon="📖" accent="success" />
					<AdminStatCard label="Retos" value={stats.retos} icon="🧩" accent="accent" />
					<AdminStatCard label="Actividades" value={stats.actividades} icon="🎲" accent="error" />
				</div>
			) : null}
		</div>
	);
}

export default AdminDashboardPage;
