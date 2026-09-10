import { useState } from "react";

import "./ActivityCard.css";

/**
 * Tarjeta de actividad recreativa (RF-011). Marcar como completada es
 * idempotente del lado del backend, así que no hace falta deshabilitar el
 * botón para siempre una vez completada (igual se oculta y se muestra el
 * estado final).
 */
function ActivityCard({ actividad, onCompletar }) {
	const [completada, setCompletada] = useState(actividad.completada);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState("");

	async function handleCompletar() {
		setError("");
		setEnviando(true);
		try {
			await onCompletar(actividad.id);
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

			{completada ? (
				<span className="activity-card__done">✓ Completada</span>
			) : (
				<button type="button" className="activity-card__button" onClick={handleCompletar} disabled={enviando}>
					{enviando ? "Guardando..." : "Marcar como completada"}
				</button>
			)}

			{error ? <p className="activity-card__error">{error}</p> : null}
		</div>
	);
}

export default ActivityCard;
