import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import * as teacherApi from "../../api/teacher.api.js";
import CreateGroupForm from "../../components/teacher/CreateGroupForm/CreateGroupForm.jsx";
import GroupCard from "../../components/teacher/GroupCard/GroupCard.jsx";
import GroupCode from "../../components/teacher/GroupCode/GroupCode.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { useDialogA11y } from "../../hooks/useDialogA11y.js";
import "./TeacherPages.css";
import "./GroupsPage.css";

/**
 * "Mis grupos" del docente (RF-022): lista de grupos con su código y la
 * cantidad de estudiantes, búsqueda por nombre y alta de grupos. Al crear uno
 * el mismo panel pasa a la pantalla "Grupo creado" con el código para compartir.
 */
function GroupsPage() {
	const [grupos, setGrupos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reloadKey, setReloadKey] = useState(0);
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [grupoCreado, setGrupoCreado] = useState(null);
	const panelTitleId = useId();
	const createdTitleRef = useRef(null);
	const { dialogRef, backdropProps } = useDialogA11y({
		open: panelAbierto,
		onClose: cerrarPanel,
		closeDisabled: submitting,
		initialFocus: "form input",
	});

	useEffect(() => {
		let cancelled = false;

		async function cargarGrupos() {
			setLoading(true);
			setError("");

			try {
				const { grupos: data } = await teacherApi.listGroups();

				if (!cancelled) {
					setGrupos(data);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar tus grupos.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarGrupos();

		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	// Al pasar a la pantalla "Grupo creado" el campo del formulario desaparece: el foco va al título.
	useEffect(() => {
		if (grupoCreado) {
			createdTitleRef.current?.focus();
		}
	}, [grupoCreado]);

	function cerrarPanel() {
		setPanelAbierto(false);
		setGrupoCreado(null);
	}

	async function handleCrear(values) {
		setSubmitting(true);

		try {
			const { grupo } = await teacherApi.createGroup(values);
			setGrupos((actuales) => [grupo, ...actuales]);
			setGrupoCreado(grupo);
		} finally {
			setSubmitting(false);
		}
	}

	const termino = busqueda.trim().toLowerCase();
	const gruposFiltrados = grupos.filter((grupo) => grupo.nombre.toLowerCase().includes(termino));

	return (
		<div className="teacher-page groups-page">
			<PageHeader
				title="Mis grupos"
				description="Creá grupos y compartí su código con tus estudiantes para que se unan."
				actions={
					<button type="button" className="teacher-page__primary" onClick={() => setPanelAbierto(true)}>
						+ Crear grupo
					</button>
				}
			/>

			{!loading && !error && grupos.length > 0 ? (
				<input
					type="search"
					className="teacher-page__search"
					aria-label="Buscar grupos por nombre"
					placeholder="Buscar grupo..."
					value={busqueda}
					onChange={(event) => setBusqueda(event.target.value)}
				/>
			) : null}

			{loading ? <p className="teacher-page__status">Cargando tus grupos...</p> : null}
			{error ? (
				<p className="teacher-page__status teacher-page__status--error" role="alert">
					{error}{" "}
					<button
						type="button"
						className="teacher-page__retry"
						onClick={() => setReloadKey((key) => key + 1)}
					>
						Reintentar
					</button>
				</p>
			) : null}

			{!loading && !error && grupos.length === 0 ? (
				<p className="teacher-page__empty">
					<strong>Todavía no tenés grupos.</strong>
					Creá el primero con «+ Crear grupo» para obtener un código que podés compartir con tus estudiantes.
				</p>
			) : null}

			{!loading && !error && grupos.length > 0 && gruposFiltrados.length === 0 ? (
				<p className="teacher-page__empty">No hay grupos que coincidan con la búsqueda.</p>
			) : null}

			{!loading && !error && gruposFiltrados.length > 0 ? (
				<div className="groups-page__grid">
					{gruposFiltrados.map((grupo) => (
						<GroupCard key={grupo.id} grupo={grupo} />
					))}
				</div>
			) : null}

			{panelAbierto ? (
				<div className="teacher-page__overlay" {...backdropProps}>
					<div
						className="teacher-page__panel"
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby={panelTitleId}
						tabIndex={-1}
					>
						{grupoCreado ? (
							<div className="groups-page__created">
								<div className="groups-page__created-icon" aria-hidden="true">
									✓
								</div>
								<h2 id={panelTitleId} ref={createdTitleRef} tabIndex={-1}>
									¡Grupo creado!
								</h2>
								<p className="groups-page__created-name">{grupoCreado.nombre}</p>
								<p className="groups-page__created-label">Código para estudiantes</p>
								<GroupCode codigo={grupoCreado.codigo} size="large" />
								<p className="groups-page__created-hint">
									Compartí este código con tus estudiantes para que puedan unirse al grupo.
								</p>
								<div className="groups-page__created-actions">
									<button type="button" className="teacher-page__secondary" onClick={cerrarPanel}>
										Cerrar
									</button>
									<Link to={`/docente/grupos/${grupoCreado.id}`} className="teacher-page__primary">
										Ver grupo
									</Link>
								</div>
							</div>
						) : (
							<>
								<div className="teacher-page__panel-header">
									<h2 id={panelTitleId}>Crear nuevo grupo</h2>
									<button
										type="button"
										className="teacher-page__panel-close"
										onClick={cerrarPanel}
										disabled={submitting}
										aria-label="Cerrar"
									>
										✕
									</button>
								</div>
								<CreateGroupForm onSubmit={handleCrear} onCancel={cerrarPanel} submitting={submitting} />
							</>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}

export default GroupsPage;
