import { avatarEmoji } from "../../../constants/avatars.js";
import "./Header.css";

/**
 * Barra superior compartida por StudentLayout y AdminLayout: saludo, avatar
 * y botón de cerrar sesión. El contenido de cada página va debajo, dentro
 * de <main className="app-layout__main">.
 */
function Header({ user, onLogout, loggingOut }) {
	return (
		<header className="app-header">
			<div className="app-header__user">
				<span className="app-header__avatar">{avatarEmoji(user?.avatar)}</span>
				<div>
					<p className="app-header__greeting">Hola, {user?.nombre_completo?.split(" ")[0] || "de nuevo"}</p>
					<p className="app-header__role">{user?.rol}</p>
				</div>
			</div>

			<button type="button" className="app-header__logout" onClick={onLogout} disabled={loggingOut}>
				{loggingOut ? "Cerrando..." : "Cerrar sesión"}
			</button>
		</header>
	);
}

export default Header;
