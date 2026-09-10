import axios from "axios";

export const TOKEN_STORAGE_KEY = "mindgame_token";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Adjunta el JWT (si existe) a cada request saliente.
api.interceptors.request.use((config) => {
	const token = localStorage.getItem(TOKEN_STORAGE_KEY);

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

export default api;
