import { useEffect, useId, useRef, useState } from "react";

import * as groupsApi from "../../api/groups.api.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog/ConfirmDialog.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { formatearFecha, mensajeDeError } from "../../utils/estadisticas.js";
import "./MyGroupsPage.css";

const LONGITUD_MAXIMA_CODIGO = 20;

/**
 * "Mis grupos" del estudiante (RF-022): se une a un grupo con el código que le
 * dio su docente, ve sus grupos y puede salir de ellos. El código se normaliza a
 * mayúsculas mientras se escribe. Unirse es idempotente: si ya pertenecía el
 * backend responde `ya_pertenecia: true` y se informa sin duplicar el grupo.
 */
function MyGroupsPage() {
	const idPrefix = useId();
	const avisoRef = useRef(null);
	const [grupos, setGrupos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reloadKey, setReloadKey] = useState(0);
	const [codigo, setCodigo] = useState("");
	const [codigoError, setCodigoError] = useState("");
	const [joining, setJoining] = useState(false);
	const [resultado, setResultado] = useState(null);
	const [grupoSaliendo, setGrupoSaliendo] = useState(null);
	const [leaving, setLeaving] = useState(false);
	const [leaveError, setLeaveError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function cargarGrupos() {
			setLoading(true);
			setError("");

			try {
				const { grupos: data } = await groupsApi.listMyGroups();

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

	// Al salir de un grupo desaparece el botón que abrió el diálogo: el foco va al aviso.
	useEffect(() => {
		if (resultado?.salio) {
			avisoRef.current?.focus();
		}
	}, [resultado]);

	function handleCodigoChange(event) {
		setCodigo(event.target.value.toUpperCase());
		setCodigoError("");
		setResultado(null);
	}

	async function handleUnirse(event) {
		event.preventDefault();
		setResultado(null);

		const limpio = codigo.trim();

		if (!limpio) {
			setCodigoError("Ingresá el código que te dio tu docente.");
			return;
		}

		if (!/^[A-Z0-9]+$/.test(limpio)) {
			setCodigoError("El código solo tiene letras y números, sin espacios ni símbolos.");
			return;
		}

		setJoining(true);
		setCodigoError("");

		try {
			const { grupo, ya_pertenecia: yaPertenecia } = await groupsApi.joinGroup(limpio);

			// Si ya pertenecía pero esta pestaña no lo mostraba (se unió desde otro dispositivo),
			// se agrega sin inventar la fecha de ingreso.
			setGrupos((actuales) =>
				actuales.some((item) => item.id === grupo.id)
					? actuales
					: [yaPertenecia ? grupo : { ...grupo, unido_en: new Date().toISOString() }, ...actuales],
			);

			setCodigo("");
			setResultado({ grupo, yaPertenecia });
		} catch (err) {
			const status = err.response?.status;

			setCodigoError(
				status === 404
					? "No existe un grupo con ese código. Revisalo e intentá de nuevo."
					: mensajeDeError(err, "No pudimos unirte al grupo. Intentá de nuevo."),
			);
		} finally {
			setJoining(false);
		}
	}

	function pedirSalida(grupo) {
		setLeaveError("");
		setGrupoSaliendo(grupo);
	}

	async function confirmarSalida() {
		const grupo = grupoSaliendo;
		setLeaving(true);
		setLeaveError("");

		try {
			await groupsApi.leaveGroup(grupo.id);
		} catch (err) {
			setLeaveError(mensajeDeError(err, "No pudimos sacarte del grupo."));
			setLeaving(false);
			return;
		}

		setLeaving(false);
		setGrupoSaliendo(null);
		setResultado({ grupo, salio: true });
		setGrupos((actuales) => actuales.filter((item) => item.id !== grupo.id));
	}

	return (
		<div className="my-groups-page">
			<PageHeader
				title="Mis grupos"
				description="Unite al grupo de tu docente con el código que te compartió."
			/>

			<form className="my-groups-page__join" onSubmit={handleUnirse} noValidate>
				<label htmlFor={`${idPrefix}-codigo`} className="my-groups-page__label">
					Código del grupo
				</label>
				<div className="my-groups-page__join-row">
					<input
						id={`${idPrefix}-codigo`}
						type="text"
						className="my-groups-page__input"
						value={codigo}
						onChange={handleCodigoChange}
						maxLength={LONGITUD_MAXIMA_CODIGO}
						placeholder="Ej: AB12CD"
						autoComplete="off"
						autoCapitalize="characters"
						spellCheck={false}
						aria-invalid={Boolean(codigoError)}
						aria-describedby={codigoError ? `${idPrefix}-codigo-error` : `${idPrefix}-codigo-hint`}
						disabled={joining}
					/>
					<button type="submit" className="my-groups-page__submit" disabled={joining}>
						{joining ? "Uniéndome..." : "Unirme"}
					</button>
				</div>
				<p id={`${idPrefix}-codigo-hint`} className="my-groups-page__hint">
					Lo escribe tu docente al crear el grupo. No importa si usás mayúsculas o minúsculas.
				</p>
				{codigoError ? (
					<p id={`${idPrefix}-codigo-error`} className="my-groups-page__error" role="alert">
						{codigoError}
					</p>
				) : null}
			</form>

			{resultado ? (
				<p
					className={
						resultado.yaPertenecia
							? "my-groups-page__notice my-groups-page__notice--info"
							: "my-groups-page__notice my-groups-page__notice--success"
					}
					role="status"
					ref={avisoRef}
					tabIndex={-1}
				>
					{resultado.salio
						? `Saliste del grupo ${resultado.grupo.nombre}.`
						: resultado.yaPertenecia
							? `Ya formás parte del grupo ${resultado.grupo.nombre}.`
							: `¡Listo! Te uniste al grupo ${resultado.grupo.nombre}.`}
				</p>
			) : null}

			<section className="my-groups-page__section" aria-label="Mis grupos">
				<h2 className="my-groups-page__section-title">Mis grupos</h2>

				{loading ? <p className="my-groups-page__status">Cargando tus grupos...</p> : null}
				{error ? (
					<p className="my-groups-page__status my-groups-page__status--error" role="alert">
						{error}{" "}
						<button
							type="button"
							className="my-groups-page__retry"
							onClick={() => setReloadKey((key) => key + 1)}
						>
							Reintentar
						</button>
					</p>
				) : null}

				{!loading && !error && grupos.length === 0 ? (
					<p className="my-groups-page__empty">
						<strong>Todavía no estás en ningún grupo.</strong>
						Pedile el código a tu docente y escribilo arriba para unirte.
					</p>
				) : null}

				{!loading && !error && grupos.length > 0 ? (
					<ul className="my-groups-page__list">
						{grupos.map((grupo) => (
							<li key={grupo.id} className="my-groups-page__card">
								<div className="my-groups-page__card-icon" aria-hidden="true">
									👥
								</div>
								<div className="my-groups-page__card-body">
									<h3 className="my-groups-page__card-name">{grupo.nombre}</h3>
									<p className="my-groups-page__card-meta">
										Docente: {grupo.docente_nombre || "—"}
										{grupo.unido_en ? ` · Te uniste el ${formatearFecha(grupo.unido_en)}` : ""}
									</p>
								</div>
								<button
									type="button"
									className="my-groups-page__leave"
									onClick={() => pedirSalida(grupo)}
									aria-label={`Salir del grupo ${grupo.nombre}`}
								>
									Salir
								</button>
							</li>
						))}
					</ul>
				) : null}
			</section>

			{grupoSaliendo ? (
				<ConfirmDialog
					title="Salir del grupo"
					confirmLabel="Salir del grupo"
					busyLabel="Saliendo..."
					busy={leaving}
					error={leaveError}
					onConfirm={confirmarSalida}
					onCancel={() => setGrupoSaliendo(null)}
				>
					<p>
						¿Seguro que querés salir del grupo <strong>{grupoSaliendo.nombre}</strong>?
					</p>
					<p>
						Tu cuenta y tu progreso no cambian. Tu docente dejará de ver tus estadísticas en este grupo, y
						podés volver a unirte con el mismo código.
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default MyGroupsPage;
