import api from "./api.js";

export const getProgress = async () => {
	const response = await api.get("/progreso");
	return response.data;
};