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
	const { data } = await api.get(`/docente/grupos/${grupoId}`);
	return data;
}

export async function listGroupStudents(grupoId) {
	const { data } = await api.get(`/docente/grupos/${grupoId}/estudiantes`);
	return data;
}

export async function removeStudentFromGroup(grupoId, estudianteId) {
	const { data } = await api.delete(`/docente/grupos/${grupoId}/estudiantes/${estudianteId}`);
	return data;
}

export async function getGroupStats(grupoId) {
	const { data } = await api.get(`/docente/grupos/${grupoId}/estadisticas`);
	return data;
}

export async function getStudentStats(estudianteId) {
	const { data } = await api.get(`/docente/estudiantes/${estudianteId}/estadisticas`);
	return data;
}
