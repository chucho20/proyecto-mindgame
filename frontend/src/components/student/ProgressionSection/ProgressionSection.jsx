import "./ProgressionSection.css";

/**
 * Sección de una lista de logros o recompensas ("Obtenidos" / "Por conseguir"):
 * encabezado con contador, grilla de tarjetas y estado vacío. Es compartida por
 * AchievementsPage y RewardsPage para no duplicar el maquetado.
 */
function ProgressionSection({ title, description, count, emptyIcon, emptyTitle, emptyText, children }) {
	return (
		<section className="progression-section" aria-label={title}>
			<div className="progression-section__header">
				<div>
					<h2 className="progression-section__title">{title}</h2>
					{description ? <p className="progression-section__description">{description}</p> : null}
				</div>

				<span className="progression-section__count" aria-label={`${count} en total`}>
					{count}
				</span>
			</div>

			{count > 0 ? (
				<div className="progression-section__grid">{children}</div>
			) : (
				<div className="progression-section__empty">
					<span className="progression-section__empty-icon" aria-hidden="true">
						{emptyIcon}
					</span>
					<h3>{emptyTitle}</h3>
					<p>{emptyText}</p>
				</div>
			)}
		</section>
	);
}

export default ProgressionSection;
