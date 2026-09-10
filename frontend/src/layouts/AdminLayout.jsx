import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import Sidebar from "../components/layout/Sidebar/Sidebar.jsx";
import Header from "../components/layout/Header/Header.jsx";
import MobileNavigation from "../components/layout/MobileNavigation/MobileNavigation.jsx";

const NAV_ITEMS = [
	{ label: "Dashboard", to: "/admin", icon: "📊", end: true },
	{ label: "Misiones", to: "/admin/misiones", icon: "🗺️" },
	{ label: "Retos", to: "/admin/retos", icon: "🧩" },
	{ label: "Actividades", to: "/admin/actividades", icon: "🎲" },
	{ label: "Contenidos", to: "/admin/contenidos", icon: "📖" },
	{ label: "Usuarios", icon: "👥", disabled: true },
	{ label: "Convivencia", icon: "🤝", disabled: true },
	{ label: "Progresión", icon: "📈", disabled: true },
	{ label: "Mi perfil", to: "/perfil", icon: "👤" },
];

/**
 * Layout compartido de las pantallas de administrador: sidebar oscuro
 * (variant="dark", igual que los mockups de admin/docente) en desktop/tablet,
 * navegación inferior en mobile. "Dashboard", "Misiones", "Retos",
 * "Actividades", "Contenidos", "Mi perfil" y "Cerrar sesión" están
 * habilitados este sprint — "Usuarios", "Convivencia" y "Progresión"
 * muestran la misma leyenda honesta que el resto del proyecto.
 */
function AdminLayout() {
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
					<Outlet />
				</main>
			</div>

			<MobileNavigation items={NAV_ITEMS} variant="dark" />
		</div>
	);
}

export default AdminLayout;
