import {
	INTERVALO_MANTENIMIENTO_MS,
	LIMITE_EVENTOS_POR_VENTANA,
	MAX_SOCKETS_POR_USUARIO,
	VENTANA_EVENTOS_MS,
} from "../constants/salas.js";
import socketAuthMiddleware from "../middlewares/socketAuth.middleware.js";
import * as salaService from "../services/sala.service.js";
import AppError from "../utils/AppError.js";

/**
 * Capa de transporte de las actividades grupales en tiempo real (RF-019). Acá solo hay cableado:
 * autenticar el handshake, registrar cada evento con su manejo de errores común y traducir el
 * "emisor" del servicio a llamadas de Socket.io. La lógica está en services/sala.service.js.
 *
 * Todo evento cliente -> servidor responde por ack con `{ ok: true, ...datos }` o
 * `{ ok: false, error: { codigo, mensaje, status, datos? } }`. Si el cliente no pasó ack, el error
 * llega como evento `sala:error` con `{ evento, error }`.
 */

const nombreRoom = (salaId) => `sala:${salaId}`;

const conexionesPorUsuario = new Map();

function aErrorDeRespuesta(error) {
	if (error instanceof salaService.ErrorDeSala) {
		return {
			codigo: error.codigo,
			mensaje: error.message,
			status: error.statusCode,
			...(error.datos ? { datos: error.datos } : {}),
		};
	}

	if (error instanceof AppError) {
		return {
			codigo: error.statusCode === 404 ? "no_encontrado" : "payload_invalido",
			mensaje: error.message,
			status: error.statusCode,
		};
	}

	console.error("Error inesperado en sockets:", error);
	return {
		codigo: "error_interno",
		mensaje: "Ocurrió un error inesperado. Intentá de nuevo más tarde.",
		status: 500,
	};
}

function errorDeSocket(codigo, mensaje, status) {
	return new salaService.ErrorDeSala(codigo, mensaje, status);
}

// El token se verificó al conectar; si venció mientras el socket seguía abierto, se corta la sesión.
function verificarSesionVigente(socket) {
	const expiraEn = socket.data.tokenExpiraEn;

	if (expiraEn !== null && Date.now() > expiraEn) {
		throw errorDeSocket("sesion_expirada", "Tu sesión venció. Iniciá sesión de nuevo.", 401);
	}
}

// Corta el socket en el instante en que vence el JWT (setTimeout admite hasta ~24,8 días).
function programarCorteDeSesion(socket) {
	const expiraEn = socket.data.tokenExpiraEn;
	if (expiraEn === null) return null;

	const espera = Math.min(Math.max(expiraEn - Date.now(), 0), 2 ** 31 - 1);
	const timer = setTimeout(() => socket.disconnect(true), espera);
	timer.unref?.();
	return timer;
}

// Ventana fija por socket: cuenta los eventos entrantes de los últimos `VENTANA_EVENTOS_MS`.
function contarEventoEntrante(socket) {
	const ahora = Date.now();
	const ventana = socket.data.ventanaTotal;

	if (!ventana || ahora - ventana.inicio >= VENTANA_EVENTOS_MS) {
		socket.data.ventanaTotal = { inicio: ahora, cuenta: 1 };
		return 1;
	}

	ventana.cuenta += 1;
	return ventana.cuenta;
}

// Ventana fija por socket: evita que un cliente sature al servidor con mensajes.
function verificarRitmo(socket) {
	const ahora = Date.now();
	const ventana = socket.data.ventana;

	if (!ventana || ahora - ventana.inicio >= VENTANA_EVENTOS_MS) {
		socket.data.ventana = { inicio: ahora, cuenta: 1 };
		return;
	}

	ventana.cuenta += 1;

	if (ventana.cuenta > LIMITE_EVENTOS_POR_VENTANA) {
		throw errorDeSocket(
			"demasiadas_solicitudes",
			"Estás enviando mensajes demasiado rápido. Esperá un momento.",
			429,
		);
	}
}

function registrarEvento(socket, nombre, manejador) {
	socket.on(nombre, async (payload, ack) => {
		// Se permite `emit("evento", callback)` sin payload.
		if (typeof payload === "function") {
			ack = payload;
			payload = undefined;
		}

		const responder = typeof ack === "function" ? ack : null;
		let respuesta;

		try {
			verificarSesionVigente(socket);
			verificarRitmo(socket);
			respuesta = { ok: true, ...(await manejador(payload)) };
		} catch (error) {
			respuesta = { ok: false, error: aErrorDeRespuesta(error) };
		}

		if (responder) {
			responder(respuesta);
		} else if (!respuesta.ok) {
			socket.emit("sala:error", { evento: nombre, error: respuesta.error });
		}

		if (!respuesta.ok && respuesta.error.codigo === "sesion_expirada") {
			socket.disconnect(true);
		}
	});
}

// Máximo de sockets simultáneos por usuario (varias pestañas sí, cientos no).
function limitarConexionesPorUsuario(socket, next) {
	const total = conexionesPorUsuario.get(socket.data.user.id) ?? 0;

	if (total >= MAX_SOCKETS_POR_USUARIO) {
		const error = new Error("Demasiadas conexiones abiertas con tu cuenta.");
		error.data = { codigo: "demasiadas_conexiones" };
		return next(error);
	}

	return next();
}

export default async function registerGameSocket(io) {
	salaService.configurarEmisor({
		aSala(salaId, evento, payload, { excepto } = {}) {
			const destino = io.to(nombreRoom(salaId));
			(excepto ? destino.except(excepto) : destino).emit(evento, payload);
		},
		aSocket(socketId, evento, payload) {
			io.to(socketId).emit(evento, payload);
		},
		unirSocket(socketId, salaId) {
			io.sockets.sockets.get(socketId)?.join(nombreRoom(salaId));
		},
		estaConectado(socketId) {
			return io.sockets.sockets.has(socketId);
		},
		sacarSocket(socketId, salaId) {
			io.sockets.sockets.get(socketId)?.leave(nombreRoom(salaId));
		},
		vaciarSala(salaId) {
			io.in(nombreRoom(salaId)).socketsLeave(nombreRoom(salaId));
		},
	});

	// Las salas viven en memoria: las que la base da por abiertas son de una ejecución anterior.
	try {
		await salaService.cerrarSalasHuerfanas();
	} catch (error) {
		console.error("No se pudieron cerrar las salas huérfanas al arrancar:", error.message);
	}

	setInterval(() => salaService.cerrarSalasVencidas(), INTERVALO_MANTENIMIENTO_MS).unref();

	io.use(socketAuthMiddleware);
	io.use(limitarConexionesPorUsuario);

	io.on("connection", (socket) => {
		const usuario = socket.data.user;
		conexionesPorUsuario.set(usuario.id, (conexionesPorUsuario.get(usuario.id) ?? 0) + 1);

		console.log("Usuario conectado:", socket.id);

		// Un socket pasivo (que solo escucha) también debe caerse cuando vence su token.
		const timerSesion = programarCorteDeSesion(socket);

		// Cuenta TODOS los eventos entrantes (también los que no tienen handler) para cortar a quien inunda.
		socket.onAny(() => {
			if (contarEventoEntrante(socket) > LIMITE_EVENTOS_POR_VENTANA * 3) {
				socket.disconnect(true);
			}
		});

		// Sala: crear, entrar, salir, consultar y cerrar.
		registrarEvento(socket, "sala:crear", (payload) => salaService.crearSala(usuario, socket.id, payload));
		registrarEvento(socket, "sala:unirse", (payload) => salaService.unirseASala(usuario, socket.id, payload));
		registrarEvento(socket, "sala:salir", (payload) => salaService.salirDeSala(usuario, payload));
		registrarEvento(socket, "sala:estado", (payload) =>
			salaService.obtenerEstado(usuario, socket.id, payload),
		);
		registrarEvento(socket, "sala:listar_disponibles", () => salaService.listarDisponibles(usuario));
		registrarEvento(socket, "sala:cerrar", (payload) => salaService.cerrarSala(usuario, socket.id, payload));

		// Actividad: instrucciones, inicio, eventos, resultado y final.
		registrarEvento(socket, "actividad:instrucciones", (payload) =>
			salaService.definirInstrucciones(usuario, socket.id, payload),
		);
		registrarEvento(socket, "actividad:iniciar", (payload) =>
			salaService.iniciarActividad(usuario, socket.id, payload),
		);
		registrarEvento(socket, "actividad:evento", (payload) =>
			salaService.enviarEvento(usuario, socket.id, payload),
		);
		registrarEvento(socket, "actividad:resultado", (payload) =>
			salaService.enviarResultado(usuario, socket.id, payload),
		);
		registrarEvento(socket, "actividad:finalizar", (payload) =>
			salaService.finalizarActividad(usuario, socket.id, payload),
		);

		socket.on("disconnect", () => {
			console.log("Usuario desconectado:", socket.id);
			if (timerSesion) clearTimeout(timerSesion);

			const restantes = (conexionesPorUsuario.get(usuario.id) ?? 1) - 1;
			if (restantes > 0) conexionesPorUsuario.set(usuario.id, restantes);
			else conexionesPorUsuario.delete(usuario.id);

			try {
				salaService.manejarDesconexion(socket.id);
			} catch (error) {
				console.error("Error inesperado en sockets al desconectar:", error);
			}
		});
	});
}
