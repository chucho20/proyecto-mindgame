import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import Sidebar from "../components/layout/Sidebar/Sidebar.jsx";
import Header from "../components/layout/Header/Header.jsx";
import MobileNavigation from "../components/layout/MobileNavigation/MobileNavigation.jsx";

const NAV_ITEMS = [
	{ label: "Inicio", to: "/estudiante", icon: "🏠", end: true },
	{ label: "Misiones", to: "/estudiante/misiones", icon: "🗺️" },
	{ label: "Retos", icon: "🧩", disabled: true },
	{ label: "Actividades", icon: "🎲", disabled: true },
	{ label: "Mi progreso", icon: "📈", disabled: true },
	{ label: "Logros", icon: "🏆", disabled: true },
	{ label: "Convivencia", icon: "🤝", disabled: true },
	{ label: "Mi perfil", to: "/perfil", icon: "👤" },
];

/**
 * Layout compartido de las pantallas de estudiante: sidebar claro en
 * desktop/tablet, navegación inferior en mobile (ver responsive.css).
 * Solo "Inicio", "Misiones", "Mi perfil" y "Cerrar sesión" están habilitados
 * este sprint — el resto muestra la leyenda honesta del proyecto.
 */
function StudentLayout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [loggingOut, setLoggingOut] = useState(false);

	async function handleLogout() {
		setLoggingOut(true);
		await logout();
		navigate("/login", { replace: true });
	}

	return (
		<div className="app-layout">
			<div className="app-layout__sidebar">
				<Sidebar
					title="MindGame"
					items={NAV_ITEMS}
					variant="light"
					footer={
						<button
							type="button"
							className="sidebar__link"
							onClick={handleLogout}
							disabled={loggingOut}
							style={{ width: "100%", textAlign: "left" }}
						>
							<span className="sidebar__icon">🚪</span>
							{loggingOut ? "Cerrando..." : "Cerrar sesión"}
						</button>
					}
				/>
			</div>

			<div className="app-layout__content">
				<Header user={user} onLogout={handleLogout} loggingOut={loggingOut} />
				<main className="app-layout__main">
					<Outlet />
				</main>
			</div>

			<MobileNavigation items={NAV_ITEMS} variant="light" />
		</div>
	);
}

export default StudentLayout;
