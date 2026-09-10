import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./ContentAdminPage.css";

/**
 * Listado + alta/edición de historias (contenido histórico, RF-009/RF-025).
 * No existe un `HistoriaForm` compartido en components/admin (a diferencia
 * de misiones/retos/actividades) — se arma acá un formulario simple inline,
 * siguiendo la misma convención visual que MissionForm/ActivityForm, en vez
 * de crear un componente nuevo para un único uso.
 */
function ContentAdminPage() {
	const [misiones, setMisiones] = useState([]);
	const [historias, setHistorias] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [historiaEditando, setHistoriaEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState("");
	const [form, setForm] = useState({ misionId: "", titulo: "", contenido: "", orden: 0 });

	async function recargar() {
		const [misionesRes, historiasRes] = await Promise.all([
			adminApi.listMissionsAdmin(),
			adminApi.listStoriesAdmin(),
		]);
		setMisiones(misionesRes.misiones);
		setHistorias(historiasRes.historias);
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarDatos() {
			setLoading(true);
			setError("");

			try {
				const [misionesRes, historiasRes] = await Promise.all([
					adminApi.listMissionsAdmin(),
					adminApi.listStoriesAdmin(),
				]);
				if (!cancelled) {
					setMisiones(misionesRes.misiones);
					setHistorias(historiasRes.historias);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar los contenidos.");
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
		setHistoriaEditando(null);
		setFormError("");
		setForm({ misionId: misiones[0]?.id || "", titulo: "", contenido: "", orden: 0 });
		setPanelAbierto(true);
	}

	function abrirEdicion(historia) {
		setHistoriaEditando(historia);
		setFormError("");
		setForm({
			misionId: historia.mision_id || "",
			titulo: historia.titulo,
			contenido: historia.contenido,
			orden: historia.orden ?? 0,
		});
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setHistoriaEditando(null);
	}

	function updateField(field, value) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setFormError("");
		setSubmitting(true);

		const payload = {
			misionId: Number(form.misionId),
			titulo: form.titulo,
			contenido: form.contenido,
			orden: Number(form.orden) || 0,
		};

		try {
			if (historiaEditando) {
				await adminApi.updateStory(historiaEditando.id, payload);
			} else {
				await adminApi.createStory(payload);
			}
			cerrarPanel();
			await recargar();
		} catch (err) {
			const details = err.response?.data?.details;
			setFormError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					err.response?.data?.message ||
					"No pudimos guardar la historia.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(historia) {
		const nuevoEstado = historia.estado === "activa" ? "inactiva" : "activa";
		await adminApi.setStoryStatus(historia.id, nuevoEstado);
		await recargar();
	}

	const misionesPorId = new Map(misiones.map((mision) => [mision.id, mision.titulo]));

	const columns = [
		{ key: "titulo", label: "Título" },
		{ key: "mision_id", label: "Misión", render: (row) => misionesPorId.get(row.mision_id) || "—" },
		{ key: "orden", label: "Orden" },
		{ key: "estado", label: "Estado", render: (row) => <StatusBadge estado={row.estado} /> },
	];

	const historiasFiltradas = historias.filter((historia) =>
		historia.titulo.toLowerCase().includes(busqueda.trim().toLowerCase()),
	);

	return (
		<div className="content-admin-page">
			<PageHeader
				title="Contenidos"
				description="Redactá el contenido histórico (historias) que los estudiantes leen en cada misión."
				actions={
					<button type="button" className="content-admin-page__new" onClick={abrirNueva}>
						+ Nueva historia
					</button>
				}
			/>

			<input
				type="search"
				className="content-admin-page__search"
				placeholder="Buscar por título..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="content-admin-page__status">Cargando contenidos...</p> : null}
			{error ? <p className="content-admin-page__status content-admin-page__status--error">{error}</p> : null}

			{!loading && !error ? (
				<DataTable
					columns={columns}
					rows={historiasFiltradas}
					emptyMessage="No hay historias que coincidan con la búsqueda."
					renderActions={(historia) => (
						<>
							<button
								type="button"
								className="content-admin-page__action"
								onClick={() => abrirEdicion(historia)}
							>
								Editar
							</button>
							<button
								type="button"
								className="content-admin-page__action"
								onClick={() => handleToggleEstado(historia)}
							>
								{historia.estado === "activa" ? "Desactivar" : "Activar"}
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="content-admin-page__overlay" onClick={cerrarPanel}>
					<div className="content-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="content-admin-page__panel-header">
							<h2>{historiaEditando ? "Editar historia" : "Nueva historia"}</h2>
							<button
								type="button"
								className="content-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>

						<form className="content-admin-page__form" onSubmit={handleSubmit}>
							{formError ? <div className="content-admin-page__form-error">{formError}</div> : null}

							<div className="content-admin-page__field">
								<label htmlFor="historia-mision">Misión</label>
								<select
									id="historia-mision"
									value={form.misionId}
									onChange={(event) => updateField("misionId", event.target.value)}
									required
								>
									<option value="" disabled>
										Elegí una misión
									</option>
									{misiones.map((mision) => (
										<option key={mision.id} value={mision.id}>
											{mision.titulo}
										</option>
									))}
								</select>
							</div>

							<div className="content-admin-page__field">
								<label htmlFor="historia-titulo">Título</label>
								<input
									id="historia-titulo"
									type="text"
									value={form.titulo}
									onChange={(event) => updateField("titulo", event.target.value)}
									required
								/>
							</div>

							<div className="content-admin-page__field">
								<label htmlFor="historia-contenido">Contenido</label>
								<textarea
									id="historia-contenido"
									rows={6}
									value={form.contenido}
									onChange={(event) => updateField("contenido", event.target.value)}
									required
								/>
							</div>

							<div className="content-admin-page__field">
								<label htmlFor="historia-orden">Orden</label>
								<input
									id="historia-orden"
									type="number"
									value={form.orden}
									onChange={(event) => updateField("orden", event.target.value)}
								/>
							</div>

							<div className="content-admin-page__form-actions">
								<button
									type="button"
									className="content-admin-page__cancel"
									onClick={cerrarPanel}
									disabled={submitting}
								>
									Cancelar
								</button>
								<button type="submit" className="content-admin-page__submit" disabled={submitting}>
									{submitting ? "Guardando..." : "Guardar"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
}

export default ContentAdminPage;
