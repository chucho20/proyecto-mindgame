import api from "./api";

// Endpoints del docente (RF-022 / RF-023). Todos exigen rol docente; las claves
// de las respuestas vienen en snake_case.

export async function createGroup({ nombre }) {
	const { data } = await api.post("/docente/grupos", { nombre });
	return data;
}

export async function listGroups() {
	const { data } = await api.get("/docente/grupos");
	return data;
}

export async function getGroup(grupoId) {
	const { data } = await api.get(`/docente/grupos/${encodeURIComponent(grupoId)}`);
	return data;
}

export async function listGroupStudents(grupoId) {
	const { data } = await api.get(`/docente/grupos/${encodeURIComponent(grupoId)}/estudiantes`);
	return data;
}

export async function removeStudentFromGroup(grupoId, estudianteId) {
	const { data } = await api.delete(
		`/docente/grupos/${encodeURIComponent(grupoId)}/estudiantes/${encodeURIComponent(estudianteId)}`,
	);
	return data;
}

export async function getGroupStats(grupoId) {
	const { data } = await api.get(`/docente/grupos/${encodeURIComponent(grupoId)}/estadisticas`);
	return data;
}

export async function getStudentStats(estudianteId) {
	const { data } = await api.get(`/docente/estudiantes/${encodeURIComponent(estudianteId)}/estadisticas`);
	return data;
}

// Actividades activas que el docente puede elegir para una sala en vivo (RF-019).
export async function listActivities() {
	const { data } = await api.get("/docente/actividades");
	return data;
}
