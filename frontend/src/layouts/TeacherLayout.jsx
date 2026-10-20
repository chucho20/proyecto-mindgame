import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import Sidebar from "../components/layout/Sidebar/Sidebar.jsx";
import Header from "../components/layout/Header/Header.jsx";
import MobileNavigation from "../components/layout/MobileNavigation/MobileNavigation.jsx";
import SalaActivaBanner from "../components/realtime/SalaActivaBanner/SalaActivaBanner.jsx";

const NAV_ITEMS = [
	{ label: "Inicio", to: "/docente", icon: "🏠", end: true },
	{ label: "Mis grupos", to: "/docente/grupos", icon: "👥" },
	{ label: "Mi perfil", to: "/perfil", icon: "👤" },
];

/**
 * Layout compartido de las pantallas de docente (RF-021): sidebar oscuro como
 * en el mapa de pantallas del docente, navegación inferior en mobile. Las
 * estadísticas se consultan desde cada grupo, por eso no tienen un ítem propio.
 */
function TeacherLayout() {
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
					variant="dark"
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
					<SalaActivaBanner />
					<Outlet />
				</main>
			</div>

			<MobileNavigation items={NAV_ITEMS} variant="dark" />
		</div>
	);
}

export default TeacherLayout;
