import React from "react";
import "./XpBar.css";

const XpBar = ({
	currentXp = 0,
	nextLevelXp = 0,
	level,
	label = "Progreso al siguiente nivel",
}) => {
	const current = Math.max(Number(currentXp) || 0, 0);
	const next = Math.max(Number(nextLevelXp) || 0, 0);

	const progress = next > 0
		? Math.min((current / next) * 100, 100)
		: 0;

	const remaining = Math.max(next - current, 0);

	return (
		<section className="xp-bar" aria-label={label}>
			<div className="xp-bar__header">
				<div className="xp-bar__title">
					{level !== undefined && level !== null ? (
						<span className="xp-bar__level">
							Nivel {level}
						</span>
					) : null}

					<span className="xp-bar__label">{label}</span>
				</div>

				<span className="xp-bar__points">
					{current} / {next} XP
				</span>
			</div>

			<div
				className="xp-bar__track"
				role="progressbar"
				aria-valuenow={current}
				aria-valuemin="0"
				aria-valuemax={next}
				aria-label={`${current} de ${next} XP`}
			>
				<div
					className="xp-bar__fill"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<p className="xp-bar__remaining">
				{remaining > 0
					? `Te faltan ${remaining} XP para el siguiente nivel`
					: "¡Has alcanzado los XP necesarios para el siguiente nivel!"}
			</p>
		</section>
	);
};

export default XpBar;