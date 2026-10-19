import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog/ConfirmDialog.jsx";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import RewardForm from "../../components/admin/RewardForm/RewardForm.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { describirCondicion } from "../../utils/progresion.js";
import "./RewardsAdminPage.css";

const COLUMNS = [
	{ key: "icono", label: "Ícono", render: (row) => row.icono || "—" },
	{ key: "nombre", label: "Nombre" },
	{
		key: "descripcion",
		label: "Descripción",
		render: (row) => (
			<span className="rewards-admin-page__truncate" title={row.descripcion || undefined}>
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
 * Listado + alta/edición/baja de recompensas (RF-015). Mismo patrón de panel
 * overlay que MissionsAdminPage — Modal sigue siendo un stub vacío este sprint.
 */
function RewardsAdminPage() {
	const [recompensas, setRecompensas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [recompensaEditando, setRecompensaEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [recompensaEliminando, setRecompensaEliminando] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	async function recargar() {
		const { recompensas: data } = await adminApi.listRewardsAdmin();
		setRecompensas(data);
	}

	async function cargar() {
		setLoading(true);
		setError("");

		try {
			await recargar();
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos cargar las recompensas.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarRecompensas() {
			try {
				const { recompensas: data } = await adminApi.listRewardsAdmin();
				if (!cancelled) {
					setRecompensas(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar las recompensas.");
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
	}, []);

	function abrirNueva() {
		setRecompensaEditando(null);
		setPanelAbierto(true);
	}

	function abrirEdicion(recompensa) {
		setRecompensaEditando(recompensa);
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setRecompensaEditando(null);
	}

	async function handleSubmit(values) {
		setSubmitting(true);
		try {
			if (recompensaEditando) {
				await adminApi.updateReward(recompensaEditando.id, values);
			} else {
				await adminApi.createReward(values);
			}
			cerrarPanel();
			setActionError("");
			await recargar();
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(recompensa) {
		const nuevoEstado = recompensa.estado === "activa" ? "inactiva" : "activa";
		setActionError("");

		try {
			await adminApi.setRewardStatus(recompensa.id, nuevoEstado);
			await recargar();
		} catch (err) {
			setActionError(err.response?.data?.message || "No pudimos cambiar el estado de la recompensa.");
		}
	}

	function pedirEliminacion(recompensa) {
		setDeleteError("");
		setRecompensaEliminando(recompensa);
	}

	async function confirmarEliminacion() {
		setDeleting(true);
		setDeleteError("");

		try {
			await adminApi.deleteReward(recompensaEliminando.id);
			setRecompensaEliminando(null);
			setActionError("");
			await recargar();
		} catch (err) {
			setDeleteError(err.response?.data?.message || "No pudimos eliminar la recompensa.");
		} finally {
			setDeleting(false);
		}
	}

	const recompensasFiltradas = recompensas.filter((recompensa) =>
		recompensa.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
	);

	return (
		<div className="rewards-admin-page">
			<PageHeader
				title="Recompensas"
				description="Definí las recompensas que los estudiantes desbloquean al reunir puntos o subir de nivel."
				actions={
					<button type="button" className="rewards-admin-page__new" onClick={abrirNueva}>
						+ Nueva recompensa
					</button>
				}
			/>

			<input
				type="search"
				className="rewards-admin-page__search"
				placeholder="Buscar por nombre..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="rewards-admin-page__status">Cargando recompensas...</p> : null}
			{error ? (
				<p className="rewards-admin-page__status rewards-admin-page__status--error">
					{error}{" "}
					<button type="button" className="rewards-admin-page__retry" onClick={cargar}>
						Reintentar
					</button>
				</p>
			) : null}
			{actionError ? (
				<p className="rewards-admin-page__status rewards-admin-page__status--error">{actionError}</p>
			) : null}

			{!loading && !error ? (
				<DataTable
					columns={COLUMNS}
					rows={recompensasFiltradas}
					emptyMessage={
						recompensas.length === 0
							? "Todavía no hay recompensas. Creá la primera con «+ Nueva recompensa»."
							: "No hay recompensas que coincidan con la búsqueda."
					}
					renderActions={(recompensa) => (
						<>
							<button
								type="button"
								className="rewards-admin-page__action"
								onClick={() => abrirEdicion(recompensa)}
							>
								Editar
							</button>
							<button
								type="button"
								className="rewards-admin-page__action"
								onClick={() => handleToggleEstado(recompensa)}
							>
								{recompensa.estado === "activa" ? "Desactivar" : "Activar"}
							</button>
							<button
								type="button"
								className="rewards-admin-page__action rewards-admin-page__action--danger"
								onClick={() => pedirEliminacion(recompensa)}
							>
								Eliminar
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="rewards-admin-page__overlay" onClick={cerrarPanel}>
					<div className="rewards-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="rewards-admin-page__panel-header">
							<h2>{recompensaEditando ? "Editar recompensa" : "Nueva recompensa"}</h2>
							<button
								type="button"
								className="rewards-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>
						<RewardForm
							initialValues={recompensaEditando}
							onSubmit={handleSubmit}
							onCancel={cerrarPanel}
							submitting={submitting}
						/>
					</div>
				</div>
			) : null}

			{recompensaEliminando ? (
				<ConfirmDialog
					title="Eliminar recompensa"
					busy={deleting}
					error={deleteError}
					onConfirm={confirmarEliminacion}
					onCancel={() => setRecompensaEliminando(null)}
				>
					<p>
						¿Seguro que querés eliminar la recompensa <strong>{recompensaEliminando.nombre}</strong>?
					</p>
					<p>
						Esta acción no se puede deshacer: también se quitará de las recompensas obtenidas por los
						estudiantes que ya la desbloquearon. Si solo querés que deje de entregarse, usá «Desactivar».
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default RewardsAdminPage;
