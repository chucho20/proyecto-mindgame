import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";

/**
 * Protege un árbol de rutas: exige sesión iniciada (AuthContext) y,
 * opcionalmente, que el rol del usuario esté dentro de `roles`.
 * Uso: <Route element={<ProtectedRoutes />}>...</Route>
 *      <Route element={<ProtectedRoutes roles={["docente"]} />}>...</Route>
 */
function ProtectedRoutes({ roles }) {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return <div className="protected-routes__loading">Cargando...</div>;
	}

	if (!user) {
		return <Navigate to="/login" replace state={{ from: location.pathname }} />;
	}

	if (roles && roles.length > 0 && !roles.includes(user.rol)) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}

export default ProtectedRoutes;
