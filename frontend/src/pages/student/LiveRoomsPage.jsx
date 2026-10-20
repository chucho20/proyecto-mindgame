import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import RoomCard from "../../components/realtime/RoomCard/RoomCard.jsx";
import { useSala } from "../../context/SalaContext.js";
import { useAccionDeSala } from "../../hooks/useAccionDeSala.js";
import { mensajeDeErrorSala } from "../../utils/salaTiempoReal.js";
import "../../components/realtime/realtime.css";
import "./LiveRoomsPage.css";

const LONGITUD_MAXIMA_CODIGO = 20;
const INTERVALO_DE_ACTUALIZACION_MS = 8000;

/**
 * "Actividades en vivo" del estudiante (RF-019, CU-007 pasos 1-2): lista las salas abiertas de sus grupos
 * (se actualiza sola cada pocos segundos) y permite entrar con el código que comparte el docente.
 * Entrar lleva a la sala de espera. Mientras tanto la conexión se abre recién al entrar a esta pantalla.
 */
function LiveRoomsPage() {
	const idPrefix = useId();
	const navigate = useNavigate();
	const { listarDisponibles, unirseASala, cerrarSiOcioso, sala: salaActual, fin } = useSala();
	const [salas, setSalas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reloadKey, setReloadKey] = useState(0);
	const [codigo, setCodigo] = useState("");
	const [codigoError, setCodigoError] = useState("");
	const [entrandoId, setEntrandoId] = useState(null);

	const entrar = useAccionDeSala(unirseASala, { enfriamientoMs: 500 });

	useEffect(() => {
		let cancelled = false;

		async function cargar(silencioso) {
			if (!silencioso) {
				setLoading(true);
				setError("");
			}

			try {
				const lista = await listarDisponibles();

				if (!cancelled) {
					setSalas(lista);
					setError("");
				}
			} catch (err) {
				if (!cancelled && !silencioso) {
					setError(mensajeDeErrorSala(err, "No pudimos cargar las actividades en vivo."));
				}
			} finally {
				if (!cancelled && !silencioso) {
					setLoading(false);
				}
			}
		}

		cargar(false);

		const intervalo = setInterval(() => {
			if (document.visibilityState === "visible") {
				cargar(true);
			}
		}, INTERVALO_DE_ACTUALIZACION_MS);

		return () => {
			cancelled = true;
			clearInterval(intervalo);
		};
	}, [listarDisponibles, reloadKey]);

	// Al salir de la pantalla sin haber entrado a una sala no hace falta seguir conectado.
	useEffect(() => cerrarSiOcioso, [cerrarSiOcioso]);

	async function unirse(datos, idParaBloquear) {
		setEntrandoId(idParaBloquear);
		const resultado = await entrar.ejecutar(datos);
		setEntrandoId(null);

		if (resultado.ok) {
			navigate(`/estudiante/salas/${resultado.valor.id}`);
		}
	}

	function handleCodigoChange(event) {
		setCodigo(event.target.value.toUpperCase());
		setCodigoError("");
	}

	function handleSubmit(event) {
		event.preventDefault();
		const limpio = codigo.trim();

		if (!limpio) {
			setCodigoError("Ingresá el código que te dio tu docente.");
			return;
		}

		if (!/^[A-Z0-9]+$/.test(limpio)) {
			setCodigoError("El código solo tiene letras y números, sin espacios ni símbolos.");
			return;
		}

		unirse({ codigo: limpio }, "codigo");
	}

	const yaEnSala = salaActual && !fin ? salaActual : null;

	return (
		<div className="live-rooms-page">
			<PageHeader
				title="Actividades en vivo"
				description="Hacé actividades junto a tu grupo, al mismo tiempo que tus compañeros."
			/>

			{yaEnSala ? (
				<div className="rt-notice rt-notice--success live-rooms-page__open" role="status">
					<span>
						Ya estás en una sala{yaEnSala.actividad?.titulo ? `: ${yaEnSala.actividad.titulo}` : ""}.
					</span>
					<Link to={`/estudiante/salas/${yaEnSala.id}`} className="rt-btn rt-btn--primary">
						Volver a la sala
					</Link>
				</div>
			) : null}

			<form className="rt-card live-rooms-page__join" onSubmit={handleSubmit} noValidate>
				<label htmlFor={`${idPrefix}-codigo`} className="live-rooms-page__label">
					¿Tenés un código de sala?
				</label>
				<div className="live-rooms-page__join-row">
					<input
						id={`${idPrefix}-codigo`}
						type="text"
						className="live-rooms-page__input"
						value={codigo}
						onChange={handleCodigoChange}
						maxLength={LONGITUD_MAXIMA_CODIGO}
						placeholder="Ej: K7M4QP"
						autoComplete="off"
						autoCapitalize="characters"
						spellCheck={false}
						aria-invalid={Boolean(codigoError)}
						aria-describedby={codigoError ? `${idPrefix}-codigo-error` : `${idPrefix}-codigo-ayuda`}
						disabled={entrar.ocupado}
					/>
					<button type="submit" className="rt-btn rt-btn--primary" disabled={entrar.ocupado}>
						{entrandoId === "codigo" ? "Entrando..." : "Entrar a la sala"}
					</button>
				</div>
				<p id={`${idPrefix}-codigo-ayuda`} className="rt-hint">
					Tu docente lo ve al crear la sala. Tenés que pertenecer al grupo de la sala para entrar.
				</p>
				{codigoError ? (
					<p id={`${idPrefix}-codigo-error`} className="rt-notice rt-notice--error" role="alert">
						{codigoError}
					</p>
				) : null}
			</form>

			{entrar.error ? (
				<p className="rt-notice rt-notice--error" role="alert">
					{entrar.error}
				</p>
			) : null}

			<section className="live-rooms-page__section" aria-labelledby={`${idPrefix}-salas`}>
				<div className="live-rooms-page__section-header">
					<h2 id={`${idPrefix}-salas`} className="rt-card__title">
						Salas abiertas de tus grupos
					</h2>
					<button
						type="button"
						className="rt-btn rt-btn--secondary"
						onClick={() => setReloadKey((key) => key + 1)}
						disabled={loading}
					>
						Actualizar
					</button>
				</div>

				{loading ? <p className="live-rooms-page__status">Buscando salas abiertas...</p> : null}
				{error ? (
					<p className="live-rooms-page__status live-rooms-page__status--error" role="alert">
						{error}{" "}
						<button
							type="button"
							className="live-rooms-page__retry"
							onClick={() => setReloadKey((key) => key + 1)}
						>
							Reintentar
						</button>
					</p>
				) : null}

				{!loading && !error && salas.length === 0 ? (
					<p className="live-rooms-page__empty">
						<strong>No hay salas abiertas por ahora.</strong>
						Cuando tu docente cree una, aparece acá sola. También podés entrar con el código.
					</p>
				) : null}

				{!loading && !error && salas.length > 0 ? (
					<ul className="live-rooms-page__list">
						{salas.map((sala) => (
							<RoomCard
								key={sala.sala_id}
								sala={sala}
								entrando={entrandoId === sala.sala_id}
								onEntrar={() => unirse({ salaId: sala.sala_id }, sala.sala_id)}
							/>
						))}
					</ul>
				) : null}
			</section>
		</div>
	);
}

export default LiveRoomsPage;
