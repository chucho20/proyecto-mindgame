import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_ROUTES } from "../../constants/roleRoutes.js";
import "./RoleRedirect.css";

/**
 * Redirige al usuario autenticado a la sección correspondiente a su rol
 * (/estudiante, /docente o /admin). Si no hay sesión, redirige a /login.
 */
function RoleRedirect() {
	const { user, loading } = useAuth();

	if (loading) {
		return <div className="role-redirect__loading">Cargando...</div>;
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const target = ROLE_HOME_ROUTES[user.rol] || "/login";

	return <Navigate to={target} replace />;
}

export default RoleRedirect;
