import { useEffect, useState } from "react";

import * as adminApi from "../../api/admin.api.js";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import StatusBadge from "../../components/admin/StatusBadge/StatusBadge.jsx";
import ChallengeForm from "../../components/admin/ChallengeForm/ChallengeForm.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./ChallengesAdminPage.css";

const TIPO_LABEL = {
	seleccion_multiple: "Selección múltiple",
	verdadero_falso: "Verdadero o falso",
	relacion_elementos: "Relación de elementos",
	orden_cronologico: "Orden cronológico",
};

/**
 * Listado + alta/edición de retos (RF-010/RF-024). Mismo patrón de panel
 * overlay que MissionsAdminPage — Modal sigue siendo un stub vacío.
 */
function ChallengesAdminPage() {
	const [misiones, setMisiones] = useState([]);
	const [retos, setRetos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [panelAbierto, setPanelAbierto] = useState(false);
	const [retoEditando, setRetoEditando] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	async function recargar() {
		const [misionesRes, retosRes] = await Promise.all([
			adminApi.listMissionsAdmin(),
			adminApi.listChallengesAdmin(),
		]);
		setMisiones(misionesRes.misiones);
		setRetos(retosRes.retos);
	}

	useEffect(() => {
		let cancelled = false;

		async function cargarDatos() {
			setLoading(true);
			setError("");

			try {
				const [misionesRes, retosRes] = await Promise.all([
					adminApi.listMissionsAdmin(),
					adminApi.listChallengesAdmin(),
				]);
				if (!cancelled) {
					setMisiones(misionesRes.misiones);
					setRetos(retosRes.retos);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar los retos.");
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

	function abrirNuevo() {
		setRetoEditando(null);
		setPanelAbierto(true);
	}

	function abrirEdicion(reto) {
		setRetoEditando(reto);
		setPanelAbierto(true);
	}

	function cerrarPanel() {
		setPanelAbierto(false);
		setRetoEditando(null);
	}

	async function handleSubmit(values) {
		setSubmitting(true);
		try {
			if (retoEditando) {
				await adminApi.updateChallenge(retoEditando.id, values);
			} else {
				await adminApi.createChallenge(values);
			}
			cerrarPanel();
			await recargar();
		} finally {
			setSubmitting(false);
		}
	}

	async function handleToggleEstado(reto) {
		const nuevoEstado = reto.estado === "activo" ? "inactivo" : "activo";
		await adminApi.setChallengeStatus(reto.id, nuevoEstado);
		await recargar();
	}

	const misionesPorId = new Map(misiones.map((mision) => [mision.id, mision.titulo]));

	const columns = [
		{
			key: "enunciado",
			label: "Enunciado",
			render: (row) => (row.enunciado.length > 70 ? `${row.enunciado.slice(0, 70)}...` : row.enunciado),
		},
		{ key: "tipo", label: "Tipo", render: (row) => TIPO_LABEL[row.tipo] || row.tipo },
		{ key: "mision_id", label: "Misión", render: (row) => misionesPorId.get(row.mision_id) || "—" },
		{ key: "puntos", label: "Puntos" },
		{ key: "estado", label: "Estado", render: (row) => <StatusBadge estado={row.estado} /> },
	];

	const retosFiltrados = retos.filter((reto) =>
		reto.enunciado.toLowerCase().includes(busqueda.trim().toLowerCase()),
	);

	return (
		<div className="challenges-admin-page">
			<PageHeader
				title="Retos"
				description="Cargá los retos históricos que el sistema evalúa automáticamente."
				actions={
					<button type="button" className="challenges-admin-page__new" onClick={abrirNuevo}>
						+ Nuevo reto
					</button>
				}
			/>

			<input
				type="search"
				className="challenges-admin-page__search"
				placeholder="Buscar por enunciado..."
				value={busqueda}
				onChange={(event) => setBusqueda(event.target.value)}
			/>

			{loading ? <p className="challenges-admin-page__status">Cargando retos...</p> : null}
			{error ? (
				<p className="challenges-admin-page__status challenges-admin-page__status--error">{error}</p>
			) : null}

			{!loading && !error ? (
				<DataTable
					columns={columns}
					rows={retosFiltrados}
					emptyMessage="No hay retos que coincidan con la búsqueda."
					renderActions={(reto) => (
						<>
							<button
								type="button"
								className="challenges-admin-page__action"
								onClick={() => abrirEdicion(reto)}
							>
								Editar
							</button>
							<button
								type="button"
								className="challenges-admin-page__action"
								onClick={() => handleToggleEstado(reto)}
							>
								{reto.estado === "activo" ? "Desactivar" : "Activar"}
							</button>
						</>
					)}
				/>
			) : null}

			{panelAbierto ? (
				<div className="challenges-admin-page__overlay" onClick={cerrarPanel}>
					<div className="challenges-admin-page__panel" onClick={(event) => event.stopPropagation()}>
						<div className="challenges-admin-page__panel-header">
							<h2>{retoEditando ? "Editar reto" : "Nuevo reto"}</h2>
							<button
								type="button"
								className="challenges-admin-page__panel-close"
								onClick={cerrarPanel}
								aria-label="Cerrar"
							>
								✕
							</button>
						</div>
						<ChallengeForm
							initialValues={retoEditando}
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

export default ChallengesAdminPage;
