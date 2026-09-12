import { Navigate, Route, Routes } from "react-router-dom";

import RoleRedirect from "../components/auth/RoleRedirect.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";
import ProfilePage from "../pages/profile/ProfilePage.jsx";
import ProtectedRoutes from "./ProtectedRoutes.jsx";
import StudentLayout from "../layouts/StudentLayout.jsx";
import MissionsPage from "../pages/student/MissionsPage.jsx";
import MissionDetailPage from "../pages/student/MissionDetailPage.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import MissionsAdminPage from "../pages/admin/MissionsAdminPage.jsx";
import ChallengesAdminPage from "../pages/admin/ChallengesAdminPage.jsx";
import ActivitiesAdminPage from "../pages/admin/ActivitiesAdminPage.jsx";
import ContentAdminPage from "../pages/admin/ContentAdminPage.jsx";
import ProgressPage from "../pages/student/ProgressPage.jsx";

// Placeholder temporal de las secciones por rol: los dashboards completos
// (estudiante RF-0xx, docente RF-022/023, admin) se construyen en sprints
// posteriores. Por ahora, cada rol aterriza acá y puede ir a su perfil.
function RoleHomePlaceholder({ label }) {
	return (
		<div className="role-home-placeholder">
			<h1>{label}</h1>
			<p>Esta sección se construye en un sprint posterior.</p>
			<a href="/perfil">Ir a mi perfil</a>
		</div>
	);
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<RoleRedirect />} />

			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password/:token" element={<ResetPasswordPage />} />

			<Route element={<ProtectedRoutes />}>
				<Route path="/perfil" element={<ProfilePage />} />
			</Route>

			<Route element={<ProtectedRoutes roles={["estudiante"]} />}>
				<Route element={<StudentLayout />}>
					<Route path="/estudiante" element={<RoleHomePlaceholder label="Panel de estudiante" />} />
					<Route path="/estudiante/misiones" element={<MissionsPage />} />
					<Route path="/estudiante/misiones/:id" element={<MissionDetailPage />} />
				<Route path="/estudiante/progreso" element={<ProgressPage />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoutes roles={["docente"]} />}>
				<Route path="/docente" element={<RoleHomePlaceholder label="Panel de docente" />} />
			</Route>

			<Route element={<ProtectedRoutes roles={["administrador"]} />}>
				<Route element={<AdminLayout />}>
					<Route path="/admin" element={<AdminDashboardPage />} />
					<Route path="/admin/misiones" element={<MissionsAdminPage />} />
					<Route path="/admin/retos" element={<ChallengesAdminPage />} />
					<Route path="/admin/actividades" element={<ActivitiesAdminPage />} />
					<Route path="/admin/contenidos" element={<ContentAdminPage />} />
				</Route>
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default AppRoutes;
