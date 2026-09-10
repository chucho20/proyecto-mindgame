import api from "./api";

export async function register({
	nombreCompleto,
	correo,
	nombreUsuario,
	password,
	edad,
	gradoCurso,
	rol,
	aceptaTratamientoDatos,
}) {
	const { data } = await api.post("/auth/register", {
		nombreCompleto,
		correo,
		nombreUsuario,
		password,
		edad,
		gradoCurso,
		rol,
		aceptaTratamientoDatos,
	});

	return data;
}

export async function login({ correo, password }) {
	const { data } = await api.post("/auth/login", { correo, password });
	return data;
}

export async function logout() {
	const { data } = await api.post("/auth/logout");
	return data;
}

export async function forgotPassword({ correo }) {
	const { data } = await api.post("/auth/forgot-password", { correo });
	return data;
}

export async function resetPassword({ token, password }) {
	const { data } = await api.post("/auth/reset-password", { token, password });
	return data;
}
