import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import MissionForm from "../../components/admin/MissionForm/MissionForm.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./MissionsAdminPage.css";

const COLUMNS = [
	{ key: "titulo", label: "Título" },
	{ key: "descripcion", label: "Descripción", render: (row) => row.descripcion || "—" },
	{ key: "orden", label: "Orden" },
	{ key: "estado", label: "Estado", render: (row) => <StatusBadge estado={row.estado} /> },
];

/**
 * Listado + alta/edición de misiones (RF-024). El componente Modal
 * (components/common/Modal) todavía es un stub vacío este sprint, así que el
 * panel de creación/edición es un overlay simple armado acá mismo — mismo
 * patrón visual repetido en Retos/Actividades/Contenidos para consistencia.
 */
function MissionsAdminPage() {
	const [misiones, setMisiones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [misionEditando, setMisionEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	async function recargar() {
		const { misiones: data } = await adminApi.listMissionsAdmin();
		setMisiones(data);
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarMisiones() {
			setLoading(true);
			setError("");

			try {
				const { misiones: data } = await adminApi.listMissionsAdmin();
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

	function abrirNueva() {
		setMisionEditando(null);
		setPanelAbierto(true);
	}

	function abrirEdicion(mision) {
		setMisionEditando(mision);
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setMisionEditando(null);
	}

	async function handleSubmit(values) {
		setSubmitting(true);
		try {
			if (misionEditando) {
				await adminApi.updateMission(misionEditando.id, values);
			} else {
				await adminApi.createMission(values);
			}
			cerrarPanel();
			await recargar();
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(mision) {
		const nuevoEstado = mision.estado === "activa" ? "inactiva" : "activa";
		await adminApi.setMissionStatus(mision.id, nuevoEstado);
		await recargar();
	}

	const misionesFiltradas = misiones.filter((mision) =>
		mision.titulo.toLowerCase().includes(busqueda.trim().toLowerCase()),
	);

	return (
		<div className="missions-admin-page">
			<PageHeader
				title="Misiones"
				description="Creá y administrá las misiones históricas que exploran los estudiantes."
				actions={
					<button type="button" className="missions-admin-page__new" onClick={abrirNueva}>
						+ Nueva misión
					</button>
				}
			/>

			<input
				type="search"
				className="missions-admin-page__search"
				placeholder="Buscar por título..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="missions-admin-page__status">Cargando misiones...</p> : null}
			{error ? (
				<p className="missions-admin-page__status missions-admin-page__status--error">{error}</p>
			) : null}

			{!loading && !error ? (
				<DataTable
					columns={COLUMNS}
					rows={misionesFiltradas}
					emptyMessage="No hay misiones que coincidan con la búsqueda."
					renderActions={(mision) => (
						<>
							<button
								type="button"
								className="missions-admin-page__action"
								onClick={() => abrirEdicion(mision)}
							>
								Editar
							</button>
							<button
								type="button"
								className="missions-admin-page__action"
								onClick={() => handleToggleEstado(mision)}
							>
								{mision.estado === "activa" ? "Desactivar" : "Activar"}
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="missions-admin-page__overlay" onClick={cerrarPanel}>
					<div className="missions-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="missions-admin-page__panel-header">
							<h2>{misionEditando ? "Editar misión" : "Nueva misión"}</h2>
							<button
								type="button"
								className="missions-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>
						<MissionForm
							initialValues={misionEditando}
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

export default MissionsAdminPage;
