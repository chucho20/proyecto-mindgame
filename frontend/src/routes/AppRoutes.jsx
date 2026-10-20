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
import RewardsAdminPage from "../pages/admin/RewardsAdminPage.jsx";
import AchievementsAdminPage from "../pages/admin/AchievementsAdminPage.jsx";
import PositiveMessagesAdminPage from "../pages/admin/PositiveMessagesAdminPage.jsx";
import ProgressPage from "../pages/student/ProgressPage.jsx";
import AchievementsPage from "../pages/student/AchievementsPage.jsx";
import RewardsPage from "../pages/student/RewardsPage.jsx";
import MyGroupsPage from "../pages/student/MyGroupsPage.jsx";
import LiveRoomsPage from "../pages/student/LiveRoomsPage.jsx";
import LiveRoomPage from "../pages/realtime/LiveRoomPage.jsx";
import TeacherLayout from "../layouts/TeacherLayout.jsx";
import TeacherDashboardPage from "../pages/teacher/TeacherDashboardPage.jsx";
import GroupsPage from "../pages/teacher/GroupsPage.jsx";
import GroupDetailPage from "../pages/teacher/GroupDetailPage.jsx";
import GroupStatsPage from "../pages/teacher/GroupStatsPage.jsx";
import StudentStatsPage from "../pages/teacher/StudentStatsPage.jsx";
import LiveSetupPage from "../pages/teacher/LiveSetupPage.jsx";

// Placeholder temporal del panel de estudiante: su dashboard completo se
// construye en un sprint posterior. Por ahora aterriza acá y puede ir a su perfil.
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
					<Route path="/estudiante/logros" element={<AchievementsPage />} />
					<Route path="/estudiante/recompensas" element={<RewardsPage />} />
					<Route path="/estudiante/grupos" element={<MyGroupsPage />} />
					<Route path="/estudiante/en-vivo" element={<LiveRoomsPage />} />
					<Route path="/estudiante/salas/:salaId" element={<LiveRoomPage />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoutes roles={["docente"]} />}>
				<Route element={<TeacherLayout />}>
					<Route path="/docente" element={<TeacherDashboardPage />} />
					<Route path="/docente/grupos" element={<GroupsPage />} />
					<Route path="/docente/grupos/:grupoId" element={<GroupDetailPage />} />
					<Route path="/docente/grupos/:grupoId/estadisticas" element={<GroupStatsPage />} />
					<Route path="/docente/grupos/:grupoId/en-vivo" element={<LiveSetupPage />} />
					<Route path="/docente/salas/:salaId" element={<LiveRoomPage />} />
					<Route path="/docente/estudiantes/:estudianteId/estadisticas" element={<StudentStatsPage />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoutes roles={["administrador"]} />}>
				<Route element={<AdminLayout />}>
					<Route path="/admin" element={<AdminDashboardPage />} />
					<Route path="/admin/misiones" element={<MissionsAdminPage />} />
					<Route path="/admin/retos" element={<ChallengesAdminPage />} />
					<Route path="/admin/actividades" element={<ActivitiesAdminPage />} />
					<Route path="/admin/contenidos" element={<ContentAdminPage />} />
					<Route path="/admin/recompensas" element={<RewardsAdminPage />} />
					<Route path="/admin/logros" element={<AchievementsAdminPage />} />
					<Route path="/admin/mensajes-positivos" element={<PositiveMessagesAdminPage />} />
				</Route>
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default AppRoutes;
