import "./AdminStatCard.css";

/**
 * Tarjeta de estadística para la landing del dashboard admin (GET
 * /admin/stats). `accent` controla el color del número, tomado de los
 * tokens de estado (coincide con las tarjetas "Retos" etc. de los mockups).
 */
function AdminStatCard({ label, value, icon, accent = "primary" }) {
	return (
		<div className={`admin-stat-card admin-stat-card--${accent}`}>
			<div className="admin-stat-card__icon">{icon}</div>
			<div>
				<p className="admin-stat-card__value">{value}</p>
				<p className="admin-stat-card__label">{label}</p>
			</div>
		</div>
	);
}

export default AdminStatCard;
