import "./XpBar.css";

/**
 * Barra de XP hacia el siguiente nivel. En el nivel máximo (`maxLevel`) no hay
 * siguiente umbral: la barra se muestra completa y el texto lo aclara.
 */
const XpBar = ({
	currentXp = 0,
	nextLevelXp = 0,
	level,
	label = "Progreso al siguiente nivel",
	maxLevel = false,
}) => {
	const current = Math.max(Number(currentXp) || 0, 0);
	const next = Math.max(Number(nextLevelXp) || 0, 0);

	const progress = maxLevel ? 100 : next > 0 ? Math.min((current / next) * 100, 100) : 0;

	const remaining = Math.max(next - current, 0);

	const barLabel = maxLevel ? "Nivel máximo" : label;

	return (
		<section className="xp-bar" aria-label={barLabel}>
			<div className="xp-bar__header">
				<div className="xp-bar__title">
					{level !== undefined && level !== null ? (
						<span className="xp-bar__level">Nivel {level}</span>
					) : null}

					<span className="xp-bar__label">{barLabel}</span>
				</div>

				<span className="xp-bar__points">{maxLevel ? `${current} XP` : `${current} / ${next} XP`}</span>
			</div>

			<div
				className="xp-bar__track"
				role="progressbar"
				aria-valuenow={current}
				aria-valuemin="0"
				aria-valuemax={maxLevel ? current : next}
				aria-label={maxLevel ? `${current} XP, nivel máximo` : `${current} de ${next} XP`}
			>
				<div className="xp-bar__fill" style={{ width: `${progress}%` }} />
			</div>

			<p className="xp-bar__remaining">
				{maxLevel
					? "¡Nivel máximo! Llegaste a lo más alto."
					: remaining > 0
						? `Te faltan ${remaining} XP para el siguiente nivel`
						: "¡Has alcanzado los XP necesarios para el siguiente nivel!"}
			</p>
		</section>
	);
};

export default XpBar;
