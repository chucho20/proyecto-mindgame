import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import ActivityForm from "../../components/admin/ActivityForm/ActivityForm.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./ActivitiesAdminPage.css";

/**
 * Listado + alta/edición de actividades recreativas (RF-011/RF-025). Mismo
 * patrón de panel overlay que MissionsAdminPage/ChallengesAdminPage — Modal
 * sigue siendo un stub vacío este sprint.
 */
function ActivitiesAdminPage() {
	const [misiones, setMisiones] = useState([]);
	const [actividades, setActividades] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [actividadEditando, setActividadEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	async function recargar() {
		const [misionesRes, actividadesRes] = await Promise.all([
			adminApi.listMissionsAdmin(),
			adminApi.listActivitiesAdmin(),
		]);
		setMisiones(misionesRes.misiones);
		setActividades(actividadesRes.actividades);
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarDatos() {
			setLoading(true);
			setError("");

			try {
				const [misionesRes, actividadesRes] = await Promise.all([
					adminApi.listMissionsAdmin(),
					adminApi.listActivitiesAdmin(),
				]);
				if (!cancelled) {
					setMisiones(misionesRes.misiones);
					setActividades(actividadesRes.actividades);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar las actividades.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarDatos();

		return () => {
			cancelled = true;
		};
	}, []);

	function abrirNueva() {
		setActividadEditando(null);
		setPanelAbierto(true);
	}

	function abrirEdicion(actividad) {
		setActividadEditando(actividad);
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setActividadEditando(null);
	}

	async function handleSubmit(values) {
		setSubmitting(true);
		try {
			if (actividadEditando) {
				await adminApi.updateActivity(actividadEditando.id, values);
			} else {
				await adminApi.createActivity(values);
			}
			cerrarPanel();
			await recargar();
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(actividad) {
		const nuevoEstado = actividad.estado === "activa" ? "inactiva" : "activa";
		await adminApi.setActivityStatus(actividad.id, nuevoEstado);
		await recargar();
	}

	const misionesPorId = new Map(misiones.map((mision) => [mision.id, mision.titulo]));

	const columns = [
		{ key: "titulo", label: "Título" },
		{ key: "tipo", label: "Tipo" },
		{ key: "mision_id", label: "Misión", render: (row) => misionesPorId.get(row.mision_id) || "—" },
		{ key: "orden", label: "Orden" },
		{ key: "estado", label: "Estado", render: (row) => <StatusBadge estado={row.estado} /> },
	];

	const actividadesFiltradas = actividades.filter((actividad) =>
		actividad.titulo.toLowerCase().includes(busqueda.trim().toLowerCase()),
	);

	return (
		<div className="activities-admin-page">
			<PageHeader
				title="Actividades"
				description="Administrá las actividades recreativas asociadas a cada misión."
				actions={
					<button type="button" className="activities-admin-page__new" onClick={abrirNueva}>
						+ Nueva actividad
					</button>
				}
			/>

			<input
				type="search"
				className="activities-admin-page__search"
				placeholder="Buscar por título..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="activities-admin-page__status">Cargando actividades...</p> : null}
			{error ? (
				<p className="activities-admin-page__status activities-admin-page__status--error">{error}</p>
			) : null}

			{!loading && !error ? (
				<DataTable
					columns={columns}
					rows={actividadesFiltradas}
					emptyMessage="No hay actividades que coincidan con la búsqueda."
					renderActions={(actividad) => (
						<>
							<button
								type="button"
								className="activities-admin-page__action"
								onClick={() => abrirEdicion(actividad)}
							>
								Editar
							</button>
							<button
								type="button"
								className="activities-admin-page__action"
								onClick={() => handleToggleEstado(actividad)}
							>
								{actividad.estado === "activa" ? "Desactivar" : "Activar"}
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="activities-admin-page__overlay" onClick={cerrarPanel}>
					<div className="activities-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="activities-admin-page__panel-header">
							<h2>{actividadEditando ? "Editar actividad" : "Nueva actividad"}</h2>
							<button
								type="button"
								className="activities-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>
						<ActivityForm
							initialValues={actividadEditando}
							misiones={misiones}
							onSubmit={handleSubmit}
							onCancel={cerrarPanel}
							submitting={submitting}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}

export default ActivitiesAdminPage;
