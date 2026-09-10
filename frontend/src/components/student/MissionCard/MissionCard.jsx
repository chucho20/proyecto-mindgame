import "./MissionCard.css";

const PROGRESO_LABEL = {
	disponible: "Disponible",
	en_progreso: "En progreso",
	completada: "Completada",
};

/**
 * Tarjeta de misión para la grilla de exploración (RF-007). Diferencia
 * visualmente disponible / en progreso / completada.
 */
function MissionCard({ mision, onClick }) {
	const progreso = mision.progreso || "disponible";

	return (
		<button type="button" className="mission-card" onClick={onClick}>
			<div className={`mission-card__badge mission-card__badge--${progreso}`}>
				{PROGRESO_LABEL[progreso] || progreso}
			</div>
			<h3 className="mission-card__title">{mision.titulo}</h3>
			{mision.descripcion ? <p className="mission-card__description">{mision.descripcion}</p> : null}
			<span className="mission-card__cta">
				{progreso === "completada"
					? "Repasar misión →"
					: progreso === "en_progreso"
						? "Continuar →"
						: "Comenzar →"}
			</span>
		</button>
	);
}

export default MissionCard;
