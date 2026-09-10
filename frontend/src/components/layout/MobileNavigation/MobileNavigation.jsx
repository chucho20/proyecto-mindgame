import { NavLink } from "react-router-dom";

import "./MobileNavigation.css";

/**
 * Navegación inferior para mobile: reemplaza al Sidebar cuando la pantalla
 * es angosta (< 768px, ver responsive.css .hide-desktop). Solo muestra los
 * ítems habilitados de `items` (los deshabilitados no tienen sentido en un
 * espacio tan chico).
 */
function MobileNavigation({ items, variant = "light" }) {
	const enabledItems = items.filter((item) => !item.disabled);

	return (
		<nav className={`mobile-nav mobile-nav--${variant} hide-desktop`}>
			{enabledItems.map((item) => (
				<NavLink
					key={item.label}
					to={item.to}
					end={item.end}
					className={({ isActive }) =>
						isActive ? "mobile-nav__link mobile-nav__link--active" : "mobile-nav__link"
					}
				>
					<span className="mobile-nav__icon">{item.icon}</span>
					<span className="mobile-nav__label">{item.label}</span>
				</NavLink>
			))}
		</nav>
	);
}

export default MobileNavigation;
