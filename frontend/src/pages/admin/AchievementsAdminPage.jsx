import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog/ConfirmDialog.jsx";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import AchievementForm from "../../components/admin/AchievementForm/AchievementForm.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { describirCondicion } from "../../utils/progresion.js";
import "./AchievementsAdminPage.css";

const COLUMNS = [
	{ key: "icono", label: "Ícono", render: (row) => row.icono || "—" },
	{ key: "nombre", label: "Nombre" },
	{
		key: "descripcion",
		label: "Descripción",
		render: (row) => (
			<span className="achievements-admin-page__truncate" title={row.descripcion || undefined}>
				{row.descripcion || "—"}
			</span>
		),
	},
	{
		key: "condicion",
		label: "Condición",
		render: (row) => describirCondicion(row.condicion_tipo, row.condicion_valor),
	},
	{ key: "estado", label: "Estado", render: (row) => <StatusBadge estado={row.estado} /> },
];

/**
 * Listado + alta/edición/baja de logros. Mismo patrón de panel
 * overlay que MissionsAdminPage — Modal sigue siendo un stub vacío este sprint.
 */
function AchievementsAdminPage() {
	const [logros, setLogros] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [logroEditando, setLogroEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [logroEliminando, setLogroEliminando] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	async function recargar() {
		const { logros: data } = await adminApi.listAchievementsAdmin();
		setLogros(data);
	}

	async function cargar() {
		setLoading(true);
		setError("");

		try {
			await recargar();
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos cargar los logros.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarLogros() {
			try {
				const { logros: data } = await adminApi.listAchievementsAdmin();
				if (!cancelled) {
					setLogros(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar los logros.");
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
	}, []);

	function abrirNueva() {
		setLogroEditando(null);
		setPanelAbierto(true);
	}

	function abrirEdicion(logro) {
		setLogroEditando(logro);
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setLogroEditando(null);
	}

	async function handleSubmit(values) {
		setSubmitting(true);
		try {
			if (logroEditando) {
				await adminApi.updateAchievement(logroEditando.id, values);
			} else {
				await adminApi.createAchievement(values);
			}
			cerrarPanel();
			setActionError("");
			await recargar();
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(logro) {
		const nuevoEstado = logro.estado === "activa" ? "inactiva" : "activa";
		setActionError("");

		try {
			await adminApi.setAchievementStatus(logro.id, nuevoEstado);
			await recargar();
		} catch (err) {
			setActionError(err.response?.data?.message || "No pudimos cambiar el estado del logro.");
		}
	}

	function pedirEliminacion(logro) {
		setDeleteError("");
		setLogroEliminando(logro);
	}

	async function confirmarEliminacion() {
		setDeleting(true);
		setDeleteError("");

		try {
			await adminApi.deleteAchievement(logroEliminando.id);
			setLogroEliminando(null);
			setActionError("");
			await recargar();
		} catch (err) {
			setDeleteError(err.response?.data?.message || "No pudimos eliminar el logro.");
		} finally {
			setDeleting(false);
		}
	}

	const logrosFiltrados = logros.filter((logro) =>
		logro.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
	);

	return (
		<div className="achievements-admin-page">
			<PageHeader
				title="Logros"
				description="Definí los logros que los estudiantes ganan al reunir puntos o subir de nivel."
				actions={
					<button type="button" className="achievements-admin-page__new" onClick={abrirNueva}>
						+ Nuevo logro
					</button>
				}
			/>

			<input
				type="search"
				className="achievements-admin-page__search"
				placeholder="Buscar por nombre..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="achievements-admin-page__status">Cargando logros...</p> : null}
			{error ? (
				<p className="achievements-admin-page__status achievements-admin-page__status--error">
					{error}{" "}
					<button type="button" className="achievements-admin-page__retry" onClick={cargar}>
						Reintentar
					</button>
				</p>
			) : null}
			{actionError ? (
				<p className="achievements-admin-page__status achievements-admin-page__status--error">
					{actionError}
				</p>
			) : null}

			{!loading && !error ? (
				<DataTable
					columns={COLUMNS}
					rows={logrosFiltrados}
					emptyMessage={
						logros.length === 0
							? "Todavía no hay logros. Creá el primero con «+ Nuevo logro»."
							: "No hay logros que coincidan con la búsqueda."
					}
					renderActions={(logro) => (
						<>
							<button
								type="button"
								className="achievements-admin-page__action"
								onClick={() => abrirEdicion(logro)}
							>
								Editar
							</button>
							<button
								type="button"
								className="achievements-admin-page__action"
								onClick={() => handleToggleEstado(logro)}
							>
								{logro.estado === "activa" ? "Desactivar" : "Activar"}
							</button>
							<button
								type="button"
								className="achievements-admin-page__action achievements-admin-page__action--danger"
								onClick={() => pedirEliminacion(logro)}
							>
								Eliminar
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="achievements-admin-page__overlay" onClick={cerrarPanel}>
					<div className="achievements-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="achievements-admin-page__panel-header">
							<h2>{logroEditando ? "Editar logro" : "Nuevo logro"}</h2>
							<button
								type="button"
								className="achievements-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>
						<AchievementForm
							initialValues={logroEditando}
							onSubmit={handleSubmit}
							onCancel={cerrarPanel}
							submitting={submitting}
						/>
					</div>
				</div>
			) : null}

			{logroEliminando ? (
				<ConfirmDialog
					title="Eliminar logro"
					busy={deleting}
					error={deleteError}
					onConfirm={confirmarEliminacion}
					onCancel={() => setLogroEliminando(null)}
				>
					<p>
						¿Seguro que querés eliminar el logro <strong>{logroEliminando.nombre}</strong>?
					</p>
					<p>
						Esta acción no se puede deshacer: también se quitará de los logros obtenidos por los estudiantes
						que ya lo ganaron. Si solo querés que deje de entregarse, usá «Desactivar».
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default AchievementsAdminPage;
