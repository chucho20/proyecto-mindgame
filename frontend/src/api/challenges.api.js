import api from "./api";

export async function listChallenges(missionId) {
	const { data } = await api.get(`/misiones/${missionId}/retos`);
	return data;
}

export async function answerChallenge(challengeId, respuesta) {
	const { data } = await api.post(`/retos/${challengeId}/responder`, { respuesta });
	return data;
}
