import "./ProgressionFeedback.css";

function listarNombres(items) {
	return items.map((item) => item.nombre).join(", ");
}

/**
 * Cierre de una respuesta de reto o de una actividad completada: celebra si
 * subió de nivel o desbloqueó recompensas/logros (`progreso` del backend) y
 * muestra la explicación del reto/actividad (`retroalimentacion`, RF-018).
 * No renderiza nada si no hay nada que mostrar.
 */
function ProgressionFeedback({ progreso, retroalimentacion }) {
	const recompensas = Array.isArray(progreso?.recompensas_nuevas) ? progreso.recompensas_nuevas : [];
	const logros = Array.isArray(progreso?.logros_nuevos) ? progreso.logros_nuevos : [];

	const celebraciones = [];

	if (progreso?.subio_de_nivel) {
		celebraciones.push(`¡Subiste al nivel ${progreso.nivel_actual}!`);
	}

	if (recompensas.length > 0) {
		celebraciones.push(
			`${recompensas.length === 1 ? "Nueva recompensa" : "Nuevas recompensas"}: ${listarNombres(recompensas)}`,
		);
	}

	if (logros.length > 0) {
		celebraciones.push(`${logros.length === 1 ? "Nuevo logro" : "Nuevos logros"}: ${listarNombres(logros)}`);
	}

	if (celebraciones.length === 0 && !retroalimentacion) {
		return null;
	}

	return (
		<div className="progression-feedback">
			{celebraciones.length > 0 ? (
				<ul className="progression-feedback__celebration">
					{celebraciones.map((texto) => (
						<li key={texto}>{texto}</li>
					))}
				</ul>
			) : null}

			{retroalimentacion ? (
				<p className="progression-feedback__text">
					<span className="progression-feedback__label">Explicación:</span> {retroalimentacion}
				</p>
			) : null}
		</div>
	);
}

export default ProgressionFeedback;
