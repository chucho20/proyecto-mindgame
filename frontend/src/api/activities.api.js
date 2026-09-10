import api from "./api";

export async function listActivities(missionId) {
	const { data } = await api.get(`/misiones/${missionId}/actividades`);
	return data;
}

export async function completeActivity(activityId) {
	const { data } = await api.post(`/actividades/${activityId}/completar`);
	return data;
}
