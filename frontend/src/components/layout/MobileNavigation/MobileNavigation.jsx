import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

import "./MobileNavigation.css";

/**
 * Navegación inferior para mobile: reemplaza al Sidebar cuando la pantalla
 * es angosta (< 768px, ver responsive.css .hide-desktop). Solo muestra los
 * ítems habilitados de `items` (los deshabilitados no tienen sentido en un
 * espacio tan chico). Cuando hay más ítems de los que entran en el ancho
 * (ej. el menú de administrador) la barra se desplaza horizontalmente y mantiene
 * visible el ítem activo.
 */
function MobileNavigation({ items, variant = "light" }) {
	const enabledItems = items.filter((item) => !item.disabled);
	const navRef = useRef(null);
	const { pathname } = useLocation();

	useEffect(() => {
		navRef.current
			?.querySelector("[aria-current='page']")
			?.scrollIntoView({ inline: "center", block: "nearest" });
	}, [pathname]);

	return (
		<nav ref={navRef} className={`mobile-nav mobile-nav--${variant} hide-desktop`}>
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
