const TIEMPO_RECONEXION_MS = 30_000;

const salas = new Map();
const socketPorUsuario = new Map();
const temporizadores = new Map();

function obtenerSala(salaId) {
	return salas.get(salaId) ?? null;
}

function crearSala(salaId) {
	if (salas.has(salaId)) {
		return salas.get(salaId);
	}

	const sala = {
		id: salaId,
		estado: "esperando",
		participantes: [],
	};

	salas.set(salaId, sala);
	return sala;
}

function agregarParticipante(salaId, usuarioId, socketId) {
	const sala = obtenerSala(salaId);
	if (!sala) return null;

	let participante = sala.participantes.find((p) => p.usuarioId === usuarioId);

	if (participante?.conectado) {
		return null;
	}

	if (!participante) {
		participante = {
			usuarioId,
			socketId: null,
			conectado: false,
			esAnfitrion: sala.participantes.length === 0,
		};

		sala.participantes.push(participante);
	}

	cancelarTemporizador(salaId, usuarioId);

	participante.socketId = socketId;
	participante.conectado = true;
	delete participante.desconectadoEn;

	socketPorUsuario.set(`${salaId}:${usuarioId}`, socketId);

	return { sala, participante };
}

function marcarDesconectado(salaId, socketId) {
	const sala = obtenerSala(salaId);
	if (!sala) return null;

	const participante = sala.participantes.find((p) => p.socketId === socketId);

	if (!participante) return null;

	participante.conectado = false;
	participante.socketId = null;
	participante.desconectadoEn = Date.now();

	socketPorUsuario.delete(`${salaId}:${participante.usuarioId}`);

	return { sala, participante };
}

function reasignarAnfitrion(sala) {
	const anfitrionActual = sala.participantes.find((p) => p.esAnfitrion && p.conectado);

	if (anfitrionActual) return anfitrionActual;

	const siguiente = sala.participantes.find((p) => p.conectado);

	for (const participante of sala.participantes) {
		participante.esAnfitrion = participante.usuarioId === siguiente?.usuarioId;
	}

	return siguiente ?? null;
}

function programarExpiracion(salaId, usuarioId, callback) {
	cancelarTemporizador(salaId, usuarioId);

	const clave = `${salaId}:${usuarioId}`;

	const timer = setTimeout(() => {
		temporizadores.delete(clave);

		const sala = obtenerSala(salaId);
		if (!sala) return;

		const participante = sala.participantes.find((p) => p.usuarioId === usuarioId);

		// Una reconexión posterior no debe ser eliminada.
		if (!participante || participante.conectado) return;

		sala.participantes = sala.participantes.filter((p) => p.usuarioId !== usuarioId);

		const anfitrion = reasignarAnfitrion(sala);

		callback({ sala, usuarioId, anfitrion });

		if (sala.participantes.length === 0) {
			salas.delete(salaId);
		}
	}, TIEMPO_RECONEXION_MS);

	temporizadores.set(clave, timer);
}

function cancelarTemporizador(salaId, usuarioId) {
	const clave = `${salaId}:${usuarioId}`;
	const timer = temporizadores.get(clave);

	if (timer) clearTimeout(timer);

	temporizadores.delete(clave);
}

function obtenerContextoPorSocket(socketId) {
	for (const sala of salas.values()) {
		const participante = sala.participantes.find((p) => p.socketId === socketId);

		if (participante) {
			return {
				salaId: sala.id,
				usuarioId: participante.usuarioId,
			};
		}
	}

	return null;
}

export {
	TIEMPO_RECONEXION_MS,
	crearSala,
	obtenerSala,
	agregarParticipante,
	marcarDesconectado,
	reasignarAnfitrion,
	programarExpiracion,
	cancelarTemporizador,
	obtenerContextoPorSocket,
};
