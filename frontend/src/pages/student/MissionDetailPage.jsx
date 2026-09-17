import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as missionsApi from "../../api/missions.api.js";
import * as challengesApi from "../../api/challenges.api.js";
import * as activitiesApi from "../../api/activities.api.js";
import ChallengeCard from "../../components/student/ChallengeCard/ChallengeCard.jsx";
import ActivityCard from "../../components/student/ActivityCard/ActivityCard.jsx";
import PositiveMessage from "../../components/student/PositiveMessage/PositiveMessage.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import "./MissionDetailPage.css";

const TABS = [
	{ id: "historia", label: "Historia" },
	{ id: "retos", label: "Retos" },
	{ id: "actividades", label: "Actividades" },
];

const PROGRESO_LABEL = {
	disponible: "Disponible",
	en_progreso: "En progreso",
	completada: "¡Completada!",
};

/**
 * Flujo secuencial historia → retos → actividades de una misión (RF-008 a
 * RF-011), calcado del recorrido de los mockups. Al entrar, marca la misión
 * como iniciada; cada acción del estudiante refresca el estado de progreso
 * (el backend recalcula si la misión quedó completa).
 */
function MissionDetailPage() {
	const { id } = useParams();
	const [tab, setTab] = useState("historia");
	const [mision, setMision] = useState(null);
	const [historias, setHistorias] = useState([]);
	const [retos, setRetos] = useState([]);
	const [actividades, setActividades] = useState([]);
	const [resultado, setResultado] = useState(null);
	const [positiveMessage, setPositiveMessage] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const refrescarMision = useCallback(async () => {
		const { mision: data } = await missionsApi.getMission(id);
		setMision(data);
		return data;
	}, [id]);

	useEffect(() => {
		let cancelled = false;

		async function cargar() {
			setLoading(true);
			setError("");

			try {
				await missionsApi.startMission(id);

				const [misionRes, historiasRes, retosRes, actividadesRes] = await Promise.all([
					missionsApi.getMission(id),
					missionsApi.listStories(id),
					challengesApi.listChallenges(id),
					activitiesApi.listActivities(id),
				]);

				if (!cancelled) {
					setMision(misionRes.mision);
					setHistorias(historiasRes.historias);
					setRetos(retosRes.retos);
					setActividades(actividadesRes.actividades);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar la misión.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargar();

		return () => {
			cancelled = true;
		};
	}, [id]);

	/**
	 * Determina si la misión pertenece a convivencia.
	 *
	 * Se contemplan las dos convenciones más habituales:
	 * "convivencia" y "Convivencia".
	 */
	const esMisionDeConvivencia =
		String(mision?.categoria || "").toLowerCase() === "convivencia";

	/**
	 * Guarda el mensaje positivo devuelto por el backend.
	 *
	 * El contrato exacto del campo todavía no está definido en el SDD,
	 * por lo que se aceptan tanto:
	 *   response.positiveMessage
	 * como:
	 *   response.positive_message
	 */
	const guardarResultado = (response) => {
		setResultado(response);

		if (!esMisionDeConvivencia) {
			setPositiveMessage(null);
			return;
		}

		const message =
			response?.positiveMessage ??
			response?.positive_message ??
			null;

		setPositiveMessage(message);
	};

	async function handleLeerHistoria(historiaId) {
		await missionsApi.completeStory(historiaId);

		setHistorias((prev) =>
			prev.map((historia) =>
				historia.id === historiaId
					? { ...historia, completada: true }
					: historia,
			),
		);

		await refrescarMision();
	}

	async function handleResponderReto(retoId, respuesta) {
		const response = await challengesApi.answerChallenge(retoId, respuesta);

		guardarResultado(response);
		await refrescarMision();

		return response;
	}

	async function handleCompletarActividad(actividadId) {
		const response = await activitiesApi.completeActivity(actividadId);

		guardarResultado(response);

		setActividades((prev) =>
			prev.map((actividad) =>
				actividad.id === actividadId
					? { ...actividad, completada: true }
					: actividad,
			),
		);

		await refrescarMision();

		return response;
	}

	if (loading) {
		return <p className="mission-detail__status">Cargando misión...</p>;
	}

	if (error || !mision) {
		return (
			<p className="mission-detail__status mission-detail__status--error">
				{error || "Misión no encontrada."}
			</p>
		);
	}

	return (
		<div className="mission-detail">
			<Link to="/estudiante/misiones" className="mission-detail__back">
				← Volver a misiones
			</Link>

			<PageHeader
				title={mision.titulo}
				description={mision.descripcion}
				actions={
					<span
						className={`mission-detail__progress mission-detail__progress--${mision.progreso}`}
					>
						{PROGRESO_LABEL[mision.progreso] || mision.progreso}
					</span>
				}
			/>

			<div className="mission-detail__tabs">
				{TABS.map((item) => (
					<button
						key={item.id}
						type="button"
						className={
							tab === item.id
								? "mission-detail__tab mission-detail__tab--active"
								: "mission-detail__tab"
						}
						onClick={() => setTab(item.id)}
					>
						{item.label}
					</button>
				))}
			</div>

			{tab === "historia" ? (
				<div className="mission-detail__section">
					{historias.length === 0 ? (
						<p className="mission-detail__empty">
							Esta misión no tiene historia todavía.
						</p>
					) : null}

					{historias.map((historia) => (
						<article
							key={historia.id}
							className="mission-detail__story"
						>
							<h2>{historia.titulo}</h2>
							<p>{historia.contenido}</p>

							{historia.completada ? (
								<span className="mission-detail__story-done">
									✓ Leída
								</span>
							) : (
								<button
									type="button"
									className="mission-detail__story-button"
									onClick={() =>
										handleLeerHistoria(historia.id)
									}
								>
									Marcar como leída
								</button>
							)}
						</article>
					))}
				</div>
			) : null}

			{tab === "retos" ? (
				<div className="mission-detail__section">
					{retos.length === 0 ? (
						<p className="mission-detail__empty">
							Esta misión no tiene retos todavía.
						</p>
					) : null}

					{retos.map((reto) => (
						<ChallengeCard
							key={reto.id}
							reto={reto}
							onResponder={handleResponderReto}
						/>
					))}

					{resultado && esMisionDeConvivencia && positiveMessage ? (
						<div className="mission-detail__feedback">
							<PositiveMessage
								message={
									typeof positiveMessage === "string"
										? positiveMessage
										: positiveMessage.message
								}
								title={
									typeof positiveMessage === "object"
										? positiveMessage.title || "¡Muy bien!"
										: "¡Muy bien!"
								}
								type={
									typeof positiveMessage === "object"
										? positiveMessage.type || "success"
										: "success"
								}
							/>
						</div>
					) : null}
				</div>
			) : null}

			{tab === "actividades" ? (
				<div className="mission-detail__section">
					{actividades.length === 0 ? (
						<p className="mission-detail__empty">
							Esta misión no tiene actividades todavía.
						</p>
					) : null}

					{actividades.map((actividad) => (
						<ActivityCard
							key={actividad.id}
							actividad={actividad}
							onCompletar={handleCompletarActividad}
						/>
					))}

					{resultado && esMisionDeConvivencia && positiveMessage ? (
						<div className="mission-detail__feedback">
							<PositiveMessage
								message={
									typeof positiveMessage === "string"
										? positiveMessage
										: positiveMessage.message
								}
								title={
									typeof positiveMessage === "object"
										? positiveMessage.title || "¡Muy bien!"
										: "¡Muy bien!"
								}
								type={
									typeof positiveMessage === "object"
										? positiveMessage.type || "success"
										: "success"
								}
							/>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}

export default MissionDetailPage;