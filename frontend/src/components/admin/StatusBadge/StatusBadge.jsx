import "./StatusBadge.css";

const ACTIVE_STATES = new Set(["activa", "activo"]);

const LABELS = {
	activa: "Activa",
	inactiva: "Inactiva",
	activo: "Activo",
	inactivo: "Inactivo",
};

/**
 * Badge de estado activa/inactiva (o activo/inactivo) para las tablas admin
 * — coincide con los badges "Activa"/"Inactivo" de los mockups.
 */
function StatusBadge({ estado }) {
	const activo = ACTIVE_STATES.has(estado);

	return (
		<span className={activo ? "status-badge status-badge--active" : "status-badge status-badge--inactive"}>
			{LABELS[estado] || estado}
		</span>
	);
}

export default StatusBadge;
