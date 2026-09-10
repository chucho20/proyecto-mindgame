import api from "./api";

export async function getStats() {
	const { data } = await api.get("/admin/stats");
	return data;
}

// --- Misiones ---

export async function listMissionsAdmin() {
	const { data } = await api.get("/admin/misiones");
	return data;
}

export async function getMissionAdmin(id) {
	const { data } = await api.get(`/admin/misiones/${id}`);
	return data;
}

export async function createMission(payload) {
	const { data } = await api.post("/admin/misiones", payload);
	return data;
}

export async function updateMission(id, payload) {
	const { data } = await api.put(`/admin/misiones/${id}`, payload);
	return data;
}

export async function setMissionStatus(id, estado) {
	const { data } = await api.put(`/admin/misiones/${id}/estado`, { estado });
	return data;
}

export async function deleteMission(id) {
	await api.delete(`/admin/misiones/${id}`);
}

// --- Historias (contenidos) ---

export async function listStoriesAdmin(missionId) {
	const { data } = await api.get("/admin/historias", {
		params: missionId ? { misionId: missionId } : undefined,
	});
	return data;
}

export async function createStory(payload) {
	const { data } = await api.post("/admin/historias", payload);
	return data;
}

export async function updateStory(id, payload) {
	const { data } = await api.put(`/admin/historias/${id}`, payload);
	return data;
}

export async function setStoryStatus(id, estado) {
	const { data } = await api.put(`/admin/historias/${id}/estado`, { estado });
	return data;
}

export async function deleteStory(id) {
	await api.delete(`/admin/historias/${id}`);
}

// --- Retos ---

export async function listChallengesAdmin(missionId) {
	const { data } = await api.get("/admin/retos", {
		params: missionId ? { misionId: missionId } : undefined,
	});
	return data;
}

export async function createChallenge(payload) {
	const { data } = await api.post("/admin/retos", payload);
	return data;
}

export async function updateChallenge(id, payload) {
	const { data } = await api.put(`/admin/retos/${id}`, payload);
	return data;
}

export async function setChallengeStatus(id, estado) {
	const { data } = await api.put(`/admin/retos/${id}/estado`, { estado });
	return data;
}

export async function deleteChallenge(id) {
	await api.delete(`/admin/retos/${id}`);
}

// --- Actividades ---

export async function listActivitiesAdmin(missionId) {
	const { data } = await api.get("/admin/actividades", {
		params: missionId ? { misionId: missionId } : undefined,
	});
	return data;
}

export async function createActivity(payload) {
	const { data } = await api.post("/admin/actividades", payload);
	return data;
}

export async function updateActivity(id, payload) {
	const { data } = await api.put(`/admin/actividades/${id}`, payload);
	return data;
}

export async function setActivityStatus(id, estado) {
	const { data } = await api.put(`/admin/actividades/${id}/estado`, { estado });
	return data;
}

export async function deleteActivity(id) {
	await api.delete(`/admin/actividades/${id}`);
}
