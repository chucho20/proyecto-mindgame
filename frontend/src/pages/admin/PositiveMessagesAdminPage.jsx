import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog/ConfirmDialog.jsx";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import PositiveMessageForm from "../../components/admin/PositiveMessageForm/PositiveMessageForm.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./PositiveMessagesAdminPage.css";

const CONTEXTO_LABELS = {
	reto_completado: "Reto completado",
	actividad_completada: "Actividad completada",
};

const COLUMNS = [
	{
		key: "contenido",
		label: "Mensaje",
		render: (row) => (
			<span className="positive-messages-admin-page__truncate" title={row.contenido}>
				{row.contenido}
			</span>
		),
	},
	{ key: "contexto", label: "Contexto", render: (row) => CONTEXTO_LABELS[row.contexto] || row.contexto },
	{ key: "estado", label: "Estado", render: (row) => <StatusBadge estado={row.estado} /> },
];

/**
 * Listado + alta/edición/baja de mensajes positivos de convivencia. El
 * estudiante recibe uno al azar de los mensajes activos del contexto que
 * corresponde al responder un reto o completar una actividad. Mismo patrón de
 * panel overlay que MissionsAdminPage — Modal sigue siendo un stub vacío.
 */
function PositiveMessagesAdminPage() {
	const [mensajes, setMensajes] = useState([]);
	const [contextosConocidos, setContextosConocidos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [mensajeEditando, setMensajeEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [mensajeEliminando, setMensajeEliminando] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	async function recargar() {
		const { mensajes: data, contextos_conocidos: contextos } = await adminApi.listPositiveMessagesAdmin();
		setMensajes(data);
		setContextosConocidos(contextos || []);
	}

	async function cargar() {
		setLoading(true);
		setError("");

		try {
			await recargar();
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos cargar los mensajes positivos.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarMensajes() {
			try {
				const { mensajes: data, contextos_conocidos: contextos } = await adminApi.listPositiveMessagesAdmin();
				if (!cancelled) {
					setMensajes(data);
					setContextosConocidos(contextos || []);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar los mensajes positivos.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarMensajes();

		return () => {
			cancelled = true;
		};
	}, []);

	function abrirNuevo() {
		setMensajeEditando(null);
		setPanelAbierto(true);
	}

	function abrirEdicion(mensaje) {
		setMensajeEditando(mensaje);
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setMensajeEditando(null);
	}

	async function handleSubmit(values) {
		setSubmitting(true);
		try {
			if (mensajeEditando) {
				await adminApi.updatePositiveMessage(mensajeEditando.id, values);
			} else {
				await adminApi.createPositiveMessage(values);
			}
			cerrarPanel();
			setActionError("");
			await recargar();
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(mensaje) {
		const nuevoEstado = mensaje.estado === "activa" ? "inactiva" : "activa";
		setActionError("");

		try {
			await adminApi.setPositiveMessageStatus(mensaje.id, nuevoEstado);
			await recargar();
		} catch (err) {
			setActionError(err.response?.data?.message || "No pudimos cambiar el estado del mensaje.");
		}
	}

	function pedirEliminacion(mensaje) {
		setDeleteError("");
		setMensajeEliminando(mensaje);
	}

	async function confirmarEliminacion() {
		setDeleting(true);
		setDeleteError("");

		try {
			await adminApi.deletePositiveMessage(mensajeEliminando.id);
			setMensajeEliminando(null);
			setActionError("");
			await recargar();
		} catch (err) {
			setDeleteError(err.response?.data?.message || "No pudimos eliminar el mensaje.");
		} finally {
			setDeleting(false);
		}
	}

	const termino = busqueda.trim().toLowerCase();
	const mensajesFiltrados = mensajes.filter(
		(mensaje) =>
			mensaje.contenido.toLowerCase().includes(termino) || mensaje.contexto.toLowerCase().includes(termino),
	);

	return (
		<div className="positive-messages-admin-page">
			<PageHeader
				title="Mensajes positivos"
				description="Administrá los mensajes de aliento que reciben los estudiantes al responder retos y completar actividades."
				actions={
					<button type="button" className="positive-messages-admin-page__new" onClick={abrirNuevo}>
						+ Nuevo mensaje
					</button>
				}
			/>

			<input
				type="search"
				className="positive-messages-admin-page__search"
				placeholder="Buscar por mensaje o contexto..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="positive-messages-admin-page__status">Cargando mensajes...</p> : null}
			{error ? (
				<p className="positive-messages-admin-page__status positive-messages-admin-page__status--error">
					{error}{" "}
					<button type="button" className="positive-messages-admin-page__retry" onClick={cargar}>
						Reintentar
					</button>
				</p>
			) : null}
			{actionError ? (
				<p className="positive-messages-admin-page__status positive-messages-admin-page__status--error">
					{actionError}
				</p>
			) : null}

			{!loading && !error ? (
				<DataTable
					columns={COLUMNS}
					rows={mensajesFiltrados}
					emptyMessage={
						mensajes.length === 0
							? "Todavía no hay mensajes positivos. Creá el primero con «+ Nuevo mensaje»."
							: "No hay mensajes que coincidan con la búsqueda."
					}
					renderActions={(mensaje) => (
						<>
							<button
								type="button"
								className="positive-messages-admin-page__action"
								onClick={() => abrirEdicion(mensaje)}
							>
								Editar
							</button>
							<button
								type="button"
								className="positive-messages-admin-page__action"
								onClick={() => handleToggleEstado(mensaje)}
							>
								{mensaje.estado === "activa" ? "Desactivar" : "Activar"}
							</button>
							<button
								type="button"
								className="positive-messages-admin-page__action positive-messages-admin-page__action--danger"
								onClick={() => pedirEliminacion(mensaje)}
							>
								Eliminar
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="positive-messages-admin-page__overlay" onClick={cerrarPanel}>
					<div className="positive-messages-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="positive-messages-admin-page__panel-header">
							<h2>{mensajeEditando ? "Editar mensaje" : "Nuevo mensaje"}</h2>
							<button
								type="button"
								className="positive-messages-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>
						<PositiveMessageForm
							initialValues={mensajeEditando}
							contextosConocidos={contextosConocidos}
							onSubmit={handleSubmit}
							onCancel={cerrarPanel}
							submitting={submitting}
						/>
					</div>
				</div>
			) : null}

			{mensajeEliminando ? (
				<ConfirmDialog
					title="Eliminar mensaje"
					busy={deleting}
					error={deleteError}
					onConfirm={confirmarEliminacion}
					onCancel={() => setMensajeEliminando(null)}
				>
					<p>¿Seguro que querés eliminar este mensaje?</p>
					<p className="positive-messages-admin-page__quote">«{mensajeEliminando.contenido}»</p>
					<p>
						Esta acción no se puede deshacer. Si solo querés que los estudiantes dejen de recibirlo, usá
						«Desactivar».
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default PositiveMessagesAdminPage;
