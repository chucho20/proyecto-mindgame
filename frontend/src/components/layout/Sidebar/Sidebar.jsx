import { NavLink } from "react-router-dom";

import "./Sidebar.css";

/**
 * Sidebar de navegación compartida por StudentLayout y AdminLayout.
 * `variant="dark"` usa los tokens --color-sidebar-* (admin/docente en los
 * mockups); `variant="light"` (default) usa fondo blanco (estudiante).
 * `items`: [{ label, to, icon, disabled }]. Los ítems `disabled` muestran la
 * leyenda honesta del proyecto en vez de un link muerto.
 */
function Sidebar({ title, items, variant = "light", footer }) {
	return (
		<aside className={`sidebar sidebar--${variant}`}>
			<div className="sidebar__brand">
				<span className="sidebar__brand-badge">MG</span>
				<span className="sidebar__brand-title">{title || "MindGame"}</span>
			</div>

			<nav className="sidebar__nav">
				{items.map((item) =>
					item.disabled ? (
						<span
							key={item.label}
							className="sidebar__link sidebar__link--disabled"
							title="Se construye en un sprint posterior"
						>
							{item.icon ? <span className="sidebar__icon">{item.icon}</span> : null}
							{item.label}
						</span>
					) : (
						<NavLink
							key={item.label}
							to={item.to}
							end={item.end}
							className={({ isActive }) =>
								isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
							}
						>
							{item.icon ? <span className="sidebar__icon">{item.icon}</span> : null}
							{item.label}
						</NavLink>
					),
				)}
			</nav>

			{footer ? <div className="sidebar__footer">{footer}</div> : null}
		</aside>
	);
}

export default Sidebar;
