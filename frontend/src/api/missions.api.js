import api from "./api";

export async function listMissions() {
	const { data } = await api.get("/misiones");
	return data;
}

export async function getMission(missionId) {
	const { data } = await api.get(`/misiones/${missionId}`);
	return data;
}

export async function startMission(missionId) {
	const { data } = await api.post(`/misiones/${missionId}/iniciar`);
	return data;
}

export async function listStories(missionId) {
	const { data } = await api.get(`/misiones/${missionId}/historias`);
	return data;
}

export async function completeStory(storyId) {
	const { data } = await api.post(`/historias/${storyId}/completar`);
	return data;
}
