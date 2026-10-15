
 
// --- Recompensas ---

export async function listRewardsAdmin() {
	const { data } = await api.get("/admin/recompensas");
	return data;
}

export async function getRewardAdmin(id) {
	const { data } = await api.get(`/admin/recompensas/${id}`);
	return data;
}

export async function createReward(payload) {
	const { data } = await api.post("/admin/recompensas", payload);
	return data;
}

export async function updateReward(id, payload) {
	const { data } = await api.put(`/admin/recompensas/${id}`, payload);
	return data;
}

export async function setRewardStatus(id, estado) {
	const { data } = await api.put(
		`/admin/recompensas/${id}/estado`,
		{ estado }
	);
	return data;
}

export async function deleteReward(id) {
	await api.delete(`/admin/recompensas/${id}`);
}

// --- Logros ---

export async function listAchievementsAdmin() {
	const { data } = await api.get("/admin/logros");
	return data;
}

export async function getAchievementAdmin(id) {
	const { data } = await api.get(`/admin/logros/${id}`);
	return data;
}

export async function createAchievement(payload) {
	const { data } = await api.post("/admin/logros", payload);
	return data;
}

export async function updateAchievement(id, payload) {
	const { data } = await api.put(`/admin/logros/${id}`, payload);
	return data;
}

export async function setAchievementStatus(id, estado) {
	const { data } = await api.put(
		`/admin/logros/${id}/estado`,
		{ estado }
	);
	return data;
}

export async function deleteAchievement(id) {
	await api.delete(`/admin/logros/${id}`);
}
