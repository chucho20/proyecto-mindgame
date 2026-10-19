import { useState } from "react";

import ProgressionFeedback from "../ProgressionFeedback/ProgressionFeedback.jsx";
import "./ActivityCard.css";

/**
 * Tarjeta de actividad recreativa (RF-011). Marcar como completada es
 * idempotente del lado del backend, así que no hace falta deshabilitar el
 * botón para siempre una vez completada (igual se oculta y se muestra el
 * estado final). Al completarla muestra los puntos, la explicación
 * (`retroalimentacion`) y lo que desbloqueó (`progreso`) si la respuesta lo trae.
 */
function ActivityCard({ actividad, onCompletar }) {
	const [completada, setCompletada] = useState(actividad.completada);
	const [respuesta, setRespuesta] = useState(null);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState("");

	async function handleCompletar() {
		setError("");
		setEnviando(true);
		try {
			const resultado = await onCompletar(actividad.id);
			setRespuesta(resultado ?? null);
			setCompletada(true);
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos marcar la actividad como completada.");
		} finally {
			setEnviando(false);
		}
	}

	return (
		<div className="activity-card">
			<div>
				<h3 className="activity-card__title">{actividad.titulo}</h3>
				{actividad.descripcion ? <p className="activity-card__description">{actividad.descripcion}</p> : null}
			</div>

			{completada ? null : (
				<button type="button" className="activity-card__button" onClick={handleCompletar} disabled={enviando}>
					{enviando ? "Guardando..." : "Marcar como completada"}
				</button>
			)}

			{/* La región en vivo existe desde el primer render: así el lector de pantalla anuncia el texto al insertarse. */}
			<div className="activity-card__live" aria-live="polite">
				{completada ? (
					<span className="activity-card__done">
						✓ Completada
						{respuesta?.puntos_obtenidos > 0
							? ` · +${respuesta.puntos_obtenidos} ${respuesta.puntos_obtenidos === 1 ? "punto" : "puntos"}`
							: ""}
					</span>
				) : null}

				{respuesta ? (
					<ProgressionFeedback
						progreso={respuesta.progreso}
						retroalimentacion={respuesta.retroalimentacion}
					/>
				) : null}

				{error ? <p className="activity-card__error">{error}</p> : null}
			</div>
		</div>
	);
}

export default ActivityCard;
