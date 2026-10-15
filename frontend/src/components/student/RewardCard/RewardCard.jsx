
import React from "react";
import "./RewardCard.css";

const RewardCard = ({
  nombre,
  descripcion,
  icono,
  obtenidaEn,
}) => {
  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";

    const fechaValida =
      fecha?.toDate instanceof Function
        ? fecha.toDate()
        : new Date(fecha);

    if (Number.isNaN(fechaValida.getTime())) {
      return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(fechaValida);
  };

  return (
    <article className="reward-card">
      <div className="reward-card__icon" aria-hidden="true">
        {icono || "🏆"}
      </div>

      <div className="reward-card__content">
        <h3 className="reward-card__title">
          {nombre || "Recompensa"}
        </h3>

        <p className="reward-card__description">
          {descripcion || "Recompensa obtenida."}
        </p>

        <p className="reward-card__date">
          <span className="reward-card__date-label">
            Obtenida el:
          </span>{" "}
          <time>
            {formatearFecha(obtenidaEn)}
          </time>
        </p>
      </div>
    </article>
  );
};

export default RewardCard;
