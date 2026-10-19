import "./AchievementCard.css";

function AchievementCard({
  nombre,
  descripcion,
  icono = "🏆",
  obtenido = false,
  condicion,
}) {
  return (
    <article
      className={`achievement-card ${
        obtenido ? "achievement-card--obtained" : "achievement-card--locked"
      }`}
    >
      <div className="achievement-card__icon" aria-hidden="true">
        {icono}
      </div>

      <div className="achievement-card__content">
        <div className="achievement-card__header">
          <h3 className="achievement-card__title">{nombre}</h3>

          <span
            className={`achievement-card__status ${
              obtenido
                ? "achievement-card__status--obtained"
                : "achievement-card__status--locked"
            }`}
          >
            {obtenido ? "Obtenido" : "Pendiente"}
          </span>
        </div>

        {descripcion && (
          <p className="achievement-card__description">{descripcion}</p>
        )}

        {!obtenido && condicion && (
          <p className="achievement-card__condition">
            <span className="achievement-card__condition-label">
              Condición:
            </span>{" "}
            {condicion}
          </p>
        )}
      </div>

      {obtenido && (
        <div className="achievement-card__check" role="img" aria-label="Logro obtenido">
          ✓
        </div>
      )}
    </article>
  );
}

export default AchievementCard;