import api from "./api";

// Grupos desde el lado del estudiante: unirse con el código del docente,
// listar sus grupos y abandonar uno. Exigen rol estudiante.

export async function joinGroup(codigo) {
	const { data } = await api.post("/grupos/unirse", { codigo });
	return data;
}

export async function listMyGroups() {
	const { data } = await api.get("/grupos/mios");
	return data;
}

export async function leaveGroup(grupoId) {
	const { data } = await api.delete(`/grupos/mios/${grupoId}`);
	return data;
}
