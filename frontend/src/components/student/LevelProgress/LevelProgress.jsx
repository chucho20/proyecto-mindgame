import React from "react";
import "./LevelProgress.css";

const LevelProgress = ({
	level = 1,
	nextLevel,
	currentXp = 0,
	nextLevelXp = 0,
}) => {
	const current = Math.max(Number(currentXp) || 0, 0);
	const next = Math.max(Number(nextLevelXp) || 0, 0);

	const calculatedProgress =
		next > 0 ? Math.min((current / next) * 100, 100) : 0;

	return (
		<section className="level-progress" aria-label="Progreso de nivel">
			<div className="level-progress__levels">
				<div className="level-progress__level level-progress__level--current">
					<span className="level-progress__eyebrow">
						Nivel actual
					</span>

					<span className="level-progress__number">
						{level}
					</span>
				</div>

				<div className="level-progress__line" aria-hidden="true">
					<div
						className="level-progress__line-fill"
						style={{ width: `${calculatedProgress}%` }}
					/>
				</div>

				<div className="level-progress__level level-progress__level--next">
					<span className="level-progress__eyebrow">
						Siguiente nivel
					</span>

					<span className="level-progress__number">
						{nextLevel ?? Number(level) + 1}
					</span>
				</div>
			</div>

			<div className="level-progress__xp">
				<span>
					<strong>{current}</strong> / {next} XP
				</span>

				<span className="level-progress__remaining">
					{next > current
						? `${next - current} XP restantes`
						: "¡Listo para subir de nivel!"}
				</span>
			</div>
		</section>
	);
};

export default LevelProgress;