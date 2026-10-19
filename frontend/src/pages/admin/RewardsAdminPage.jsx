import { useEffect, useId, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog/ConfirmDialog.jsx";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import RewardForm from "../../components/admin/RewardForm/RewardForm.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";
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
	const [reloadFailed, setReloadFailed] = useState(false);
	const panelTitleId = useId();
	const { dialogRef, backdropProps } = useDialogA11y({
		open: panelAbierto,
		onClose: cerrarPanel,
		closeDisabled: submitting,
		initialFocus: "form input, form textarea, form select",
	});

	async function recargar() {
		const { recompensas: data } = await adminApi.listRewardsAdmin();
		setRecompensas(data);
	}

	/**
	 * Recarga la lista DESPUÉS de una acción que ya se guardó: si la recarga falla no
	 * hay que mostrar "no se pudo guardar" (sí se guardó), sino un aviso propio en la página.
	 */
	async function recargarTrasAccion() {
		try {
			await recargar();
			setReloadFailed(false);
		} catch {
			setReloadFailed(true);
		}
	}

	async function cargar() {
		setLoading(true);
		setError("");
		setReloadFailed(false);

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
		} finally {
			setSubmitting(false);
		}

		// Si el guardado falló, el error ya subió al formulario (el panel sigue abierto).
		cerrarPanel();
		setActionError("");
		await recargarTrasAccion();
	}

	async function handleToggleEstado(recompensa) {
		const nuevoEstado = recompensa.estado === "activa" ? "inactiva" : "activa";
		setActionError("");

		try {
			await adminApi.setRewardStatus(recompensa.id, nuevoEstado);
		} catch (err) {
			setActionError(err.response?.data?.message || "No pudimos cambiar el estado de la recompensa.");
			return;
		}

		await recargarTrasAccion();
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
		} catch (err) {
			setDeleteError(err.response?.data?.message || "No pudimos eliminar la recompensa.");
			setDeleting(false);
			return;
		}

		setDeleting(false);
		setRecompensaEliminando(null);
		setActionError("");
		await recargarTrasAccion();
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
				aria-label="Buscar recompensas por nombre"
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
				<p className="rewards-admin-page__status rewards-admin-page__status--error" role="alert">
					{actionError}
				</p>
			) : null}
			{reloadFailed ? (
				<p className="rewards-admin-page__status rewards-admin-page__status--error" role="alert">
					Se guardó, pero no pudimos actualizar la lista.{" "}
					<button type="button" className="rewards-admin-page__retry" onClick={recargarTrasAccion}>
						Reintentar
					</button>
				</p>
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
				<div className="rewards-admin-page__overlay" {...backdropProps}>
					<div
						className="rewards-admin-page__panel"
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby={panelTitleId}
						tabIndex={-1}
					>
						<div className="rewards-admin-page__panel-header">
							<h2 id={panelTitleId}>{recompensaEditando ? "Editar recompensa" : "Nueva recompensa"}</h2>
							<button
								type="button"
								className="rewards-admin-page__panel-close"
								onClick={cerrarPanel}
								disabled={submitting}
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
					<p>Esta acción no se puede deshacer.</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default RewardsAdminPage;
