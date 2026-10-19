import { esNumero, SIN_DATO } from "../../../utils/estadisticas.js";
import "./StatBar.css";

/**
 * Barra horizontal simple hecha con CSS (sin librerías de gráficos). Si `value`
 * no es un número (el backend informa `null` cuando no hay datos) no dibuja
 * progreso y muestra "—". `max` es el valor que llena la barra; `valueLabel`
 * es el texto que se muestra al lado (ya formateado).
 * `tone`: "primary" | "success" | "accent" | "error".
 */
function StatBar({ value, max = 100, label, valueLabel, tone = "primary" }) {
	const hayDato = esNumero(value) && esNumero(max) && max > 0;
	const porcentaje = hayDato ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

	return (
		<div className="stat-bar">
			<div
				className="stat-bar__track"
				{...(hayDato
					? {
							role: "progressbar",
							"aria-label": label,
							"aria-valuemin": 0,
							"aria-valuemax": max,
							"aria-valuenow": value,
						}
					: { "aria-hidden": "true" })}
			>
				<div className={`stat-bar__fill stat-bar__fill--${tone}`} style={{ width: `${porcentaje}%` }} />
			</div>
			<span className="stat-bar__value">{hayDato ? (valueLabel ?? value) : SIN_DATO}</span>
		</div>
	);
}

export default StatBar;
