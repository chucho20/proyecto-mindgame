import { GRACIA_DOCENTE_MS, GRACIA_ESTUDIANTE_MS, MAX_EVENTOS_RECIENTES } from "../constants/salas.js";
import { registrarError } from "../utils/logger.js";

/**
 * Registro en memoria de las salas abiertas (RF-019). No hace entrada/salida ni emite eventos:
 * solo guarda estado y mantiene sus índices; la lógica de negocio vive en services/sala.service.js.
 *
 * Una sala tiene un `Map` de participantes (el docente anfitrión y los estudiantes). Cuando un
 * participante se desconecta no se lo quita de inmediato: queda "desconectado" durante un
 * período de gracia (desconexión controlada) y, si vuelve a tiempo, retoma su lugar.
 *
 * Todo lo que se crea acá se libera en `eliminarSala` (participantes, índices y temporizadores),
 * así una sala cerrada no deja memoria ni timers colgando.
 */

const salas = new Map(); // salaId -> sala
const idPorCodigo = new Map(); // codigo -> salaId
const contextoPorSocket = new Map(); // socketId -> { salaId, usuarioId }
const salaPorUsuario = new Map(); // usuarioId -> salaId (un usuario está en una sola sala a la vez)
const salaPorGrupo = new Map(); // grupoId -> salaId (una sala abierta por grupo)
const gruposReservados = new Set(); // grupos con una creación de sala en curso (evita la carrera del await)
const docentesReservados = new Set(); // docentes con una creación de sala en curso
const temporizadores = new Map(); // `${salaId}:${usuarioId}` -> Timeout

function claveTemporizador(salaId, usuarioId) {
	return `${salaId}:${usuarioId}`;
}

// --- Salas ---

export function registrarSala({ id, codigo, actividad, grupo, docenteId, capacidadMinima, instrucciones }) {
	const sala = {
		id,
		codigo,
		actividad,
		grupo,
		docenteId,
		capacidadMinima,
		instrucciones,
		estado: "esperando",
		creadaEn: Date.now(),
		iniciadaEn: null,
		secuencia: 0,
		eventos: [],
		participantes: new Map(),
		// Banderas de operaciones asíncronas en curso (iniciar, finalizar, cerrar): mientras una
		// está activa, las demás se rechazan en vez de pisarse.
		ocupada: false,
		finalizacion: null,
	};

	salas.set(id, sala);
	idPorCodigo.set(codigo, id);
	salaPorGrupo.set(grupo.id, id);

	return sala;
}

export function obtenerSala(salaId) {
	return salas.get(salaId) ?? null;
}

export function obtenerSalaPorCodigo(codigo) {
	const salaId = idPorCodigo.get(codigo);
	return salaId === undefined ? null : obtenerSala(salaId);
}

export function obtenerSalaDeGrupo(grupoId) {
	const salaId = salaPorGrupo.get(grupoId);
	return salaId === undefined ? null : obtenerSala(salaId);
}

export function obtenerSalaDeUsuario(usuarioId) {
	const salaId = salaPorUsuario.get(usuarioId);
	return salaId === undefined ? null : obtenerSala(salaId);
}

export function obtenerSalaDeDocente(docenteId) {
	for (const sala of salas.values()) {
		if (sala.docenteId === docenteId) return sala;
	}

	return null;
}

export function listarSalas() {
	return [...salas.values()];
}

/**
 * Reserva el grupo para crear su sala. La reserva se hace de forma síncrona (antes de cualquier
 * `await`), de modo que dos "crear sala" simultáneos del mismo grupo no pasen ambos la validación.
 */
export function reservarGrupo(grupoId) {
	if (salaPorGrupo.has(grupoId) || gruposReservados.has(grupoId)) {
		return false;
	}

	gruposReservados.add(grupoId);
	return true;
}

export function liberarGrupo(grupoId) {
	gruposReservados.delete(grupoId);
}

export function reservarDocente(docenteId) {
	if (docentesReservados.has(docenteId)) {
		return false;
	}

	docentesReservados.add(docenteId);
	return true;
}

export function liberarDocente(docenteId) {
	docentesReservados.delete(docenteId);
}

/** Quita la sala del registro y libera sus índices y temporizadores. Devuelve la sala (o null). */
export function eliminarSala(salaId) {
	const sala = salas.get(salaId);
	if (!sala) return null;

	for (const participante of sala.participantes.values()) {
		cancelarTemporizador(salaId, participante.usuarioId);

		if (participante.socketId && contextoPorSocket.get(participante.socketId)?.salaId === salaId) {
			contextoPorSocket.delete(participante.socketId);
		}

		if (salaPorUsuario.get(participante.usuarioId) === salaId) {
			salaPorUsuario.delete(participante.usuarioId);
		}
	}

	if (salaPorGrupo.get(sala.grupo.id) === salaId) salaPorGrupo.delete(sala.grupo.id);
	if (idPorCodigo.get(sala.codigo) === salaId) idPorCodigo.delete(sala.codigo);

	salas.delete(salaId);
	return sala;
}

/** Guarda un evento en el historial acotado (para el snapshot de quien llega tarde o se reconecta). */
export function guardarEvento(sala, evento) {
	sala.eventos.push(evento);

	if (sala.eventos.length > MAX_EVENTOS_RECIENTES) {
		sala.eventos.splice(0, sala.eventos.length - MAX_EVENTOS_RECIENTES);
	}
}

// --- Participantes ---

/**
 * Agrega al usuario a la sala o lo reubica en su nuevo socket. Es idempotente: si el mismo
 * socket ya estaba dentro devuelve `yaEstaba`. Si el usuario estaba conectado desde OTRO socket
 * (por ejemplo, otra pestaña, o una conexión caída que el servidor aún no detectó) el nuevo socket
 * toma su lugar y se informa el `socketAnterior` para que el servicio lo saque de la sala.
 */
export function agregarParticipante(sala, usuario, socketId) {
	let participante = sala.participantes.get(usuario.id);

	if (participante?.conectado && participante.socketId === socketId) {
		return { participante, yaEstaba: true, reconexion: false, socketAnterior: null };
	}

	const reconexion = Boolean(participante) && !participante.abandono;
	let socketAnterior = null;

	if (!participante) {
		participante = {
			usuarioId: usuario.id,
			rol: usuario.rol,
			nombreUsuario: usuario.nombreUsuario,
			avatar: usuario.avatar ?? null,
			esAnfitrion: usuario.rol === "docente",
			socketId: null,
			conectado: false,
			abandono: false,
			eventosEnviados: 0,
			resultadoReportado: null,
		};
		sala.participantes.set(usuario.id, participante);
	} else if (participante.socketId) {
		socketAnterior = participante.socketId;
		contextoPorSocket.delete(socketAnterior);
	}

	cancelarTemporizador(sala.id, usuario.id);

	participante.socketId = socketId;
	participante.conectado = true;
	participante.abandono = false;
	delete participante.desconectadoEn;

	contextoPorSocket.set(socketId, { salaId: sala.id, usuarioId: usuario.id });
	salaPorUsuario.set(usuario.id, sala.id);

	return { participante, yaEstaba: false, reconexion, socketAnterior };
}

/**
 * Marca como desconectado al participante dueño del socket (sin quitarlo: período de gracia).
 * Devuelve `null` si el socket no estaba en ninguna sala, o si ya fue reemplazado por otro socket
 * del mismo usuario (el viejo que se cae después no debe pisar a la conexión nueva).
 */
export function marcarDesconectado(socketId) {
	const contexto = contextoPorSocket.get(socketId);
	if (!contexto) return null;

	contextoPorSocket.delete(socketId);

	const sala = salas.get(contexto.salaId);
	const participante = sala?.participantes.get(contexto.usuarioId);

	if (!sala || !participante || participante.socketId !== socketId) return null;

	participante.conectado = false;
	participante.socketId = null;
	participante.desconectadoEn = Date.now();

	return { sala, participante };
}

/**
 * Saca al participante de la sala. Con `marcarAbandono` conserva su registro (para dejar
 * constancia en el resultado de que se fue en plena actividad); sin él, lo borra.
 * Devuelve el socket que tenía, para que el servicio lo saque de la room de Socket.io.
 */
export function quitarParticipante(sala, usuarioId, { marcarAbandono = false } = {}) {
	const participante = sala.participantes.get(usuarioId);
	if (!participante) return null;

	cancelarTemporizador(sala.id, usuarioId);

	const socketId = participante.socketId;
	if (socketId) contextoPorSocket.delete(socketId);
	if (salaPorUsuario.get(usuarioId) === sala.id) salaPorUsuario.delete(usuarioId);

	if (marcarAbandono) {
		participante.abandono = true;
		participante.conectado = false;
		participante.socketId = null;
		delete participante.desconectadoEn;
	} else {
		sala.participantes.delete(usuarioId);
	}

	return { participante, socketId };
}

export function obtenerContextoPorSocket(socketId) {
	return contextoPorSocket.get(socketId) ?? null;
}

/** Participantes vigentes (sin los que abandonaron) en el formato público de la API. */
export function listarParticipantes(sala) {
	return [...sala.participantes.values()]
		.filter((participante) => !participante.abandono)
		.map((participante) => ({
			usuario_id: participante.usuarioId,
			nombre_usuario: participante.nombreUsuario,
			avatar: participante.avatar,
			rol: participante.rol,
			conectado: participante.conectado,
			es_anfitrion: participante.esAnfitrion,
		}));
}

/** Estudiantes vigentes de la sala; con `soloConectados` cuenta únicamente los que están en línea. */
export function contarEstudiantes(sala, { soloConectados = false } = {}) {
	let total = 0;

	for (const participante of sala.participantes.values()) {
		if (participante.rol !== "estudiante" || participante.abandono) continue;
		if (soloConectados && !participante.conectado) continue;
		total += 1;
	}

	return total;
}

// --- Temporizadores de reconexión ---

/**
 * Programa la expiración del período de gracia de un participante desconectado. Si vuelve antes
 * (o la sala se elimina) el temporizador se cancela; si llega a dispararse y el participante
 * sigue ausente, se invoca `alExpirar(sala, participante)`.
 */
export function programarExpiracion(sala, participante, alExpirar) {
	cancelarTemporizador(sala.id, participante.usuarioId);

	const espera = participante.rol === "docente" ? GRACIA_DOCENTE_MS : GRACIA_ESTUDIANTE_MS;
	const clave = claveTemporizador(sala.id, participante.usuarioId);

	const timer = setTimeout(() => {
		temporizadores.delete(clave);

		const vigente =
			salas.get(sala.id) === sala && sala.participantes.get(participante.usuarioId) === participante;

		// Una reconexión posterior (o una salida voluntaria) no debe ser tratada como expiración.
		if (!vigente || participante.conectado || participante.abandono) return;

		try {
			alExpirar(sala, participante);
		} catch (error) {
			// Un error dentro de un timer no debe tumbar el proceso.
			registrarError("sockets al expirar la reconexión", error);
		}
	}, espera);

	timer.unref?.();
	temporizadores.set(clave, timer);

	return espera;
}

export function cancelarTemporizador(salaId, usuarioId) {
	const clave = claveTemporizador(salaId, usuarioId);
	const timer = temporizadores.get(clave);

	if (timer) clearTimeout(timer);

	temporizadores.delete(clave);
}
