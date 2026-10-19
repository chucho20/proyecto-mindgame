import { formatearFecha } from "../../../utils/progresion.js";
import "./RewardCard.css";

/**
 * Tarjeta de recompensa (RF-015). Obtenida: muestra la fecha en que se ganó.
 * Pendiente: se ve atenuada y muestra la condición que falta cumplir.
 */
function RewardCard({ nombre, descripcion, icono, obtenida = false, condicion, obtenidaEn }) {
	const fecha = obtenida ? formatearFecha(obtenidaEn) : null;

	return (
		<article className={`reward-card ${obtenida ? "reward-card--obtained" : "reward-card--locked"}`}>
			<div className="reward-card__icon" aria-hidden="true">
				{icono || "🎁"}
			</div>

			<div className="reward-card__content">
				<div className="reward-card__header">
					<h3 className="reward-card__title">{nombre}</h3>

					<span
						className={`reward-card__status ${
							obtenida ? "reward-card__status--obtained" : "reward-card__status--locked"
						}`}
					>
						{obtenida ? "Obtenida" : "Pendiente"}
					</span>
				</div>

				{descripcion ? <p className="reward-card__description">{descripcion}</p> : null}

				{obtenida && fecha ? (
					<p className="reward-card__meta">
						<span className="reward-card__meta-label">Obtenida el:</span>{" "}
						<time dateTime={new Date(obtenidaEn).toISOString()}>{fecha}</time>
					</p>
				) : null}

				{!obtenida && condicion ? (
					<p className="reward-card__meta">
						<span className="reward-card__meta-label">Condición:</span> {condicion}
					</p>
				) : null}
			</div>

			{obtenida ? (
				<div className="reward-card__check" role="img" aria-label="Recompensa obtenida">
					✓
				</div>
			) : null}
		</article>
	);
}

export default RewardCard;
