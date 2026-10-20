import { io } from "socket.io-client";

import { mensajeDeCodigoSala } from "../utils/salaTiempoReal.js";

const URL_POR_DEFECTO = "http://localhost:3000";

/**
 * URL del servidor de Socket.io. Prioriza `VITE_SOCKET_URL`; si no está, la deriva de
 * `VITE_API_URL` (el mismo servidor, sin el sufijo `/api`) y por último usa el servidor local.
 */
export function resolverUrlSocket() {
	const explicita = import.meta.env.VITE_SOCKET_URL;

	if (explicita) {
		return explicita;
	}

	const api = import.meta.env.VITE_API_URL;

	// Con una URL relativa (`/api`, detrás de un proxy) el socket va al mismo origen: cadena vacía.
	return api === undefined || api === "" ? URL_POR_DEFECTO : api.replace(/\/api\/?$/, "");
}

/**
 * Crea el cliente de Socket.io sin conectarlo (`autoConnect: false`): quien lo usa decide cuándo
 * llamar a `connect()`. El token del JWT se lee en cada intento de conexión (también en las
 * reconexiones automáticas), así que siempre viaja el vigente en `auth.token`.
 */
export function crearSocket(obtenerToken) {
	return io(resolverUrlSocket(), {
		autoConnect: false,
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 3000,
		auth: (entregar) => entregar({ token: obtenerToken() }),
	});
}

/**
 * Error de una operación de sala: normaliza los errores del ack del servidor
 * (`{ codigo, mensaje, status, datos? }`) y los propios del cliente (`sin_conexion`, `tiempo_agotado`).
 * `message` ya viene en español, listo para mostrar.
 */
export class ErrorSala extends Error {
	constructor(codigo, { mensajeServidor, status, datos } = {}) {
		super(mensajeDeCodigoSala(codigo, { mensajeServidor, datos }));
		this.name = "ErrorSala";
		this.codigo = codigo;
		this.status = status ?? null;
		this.datos = datos ?? null;
	}
}

/**
 * Emite un evento y espera su ack como promesa. Resuelve con la respuesta `{ ok: true, ...datos }`
 * y rechaza con `ErrorSala` si el servidor respondió error, si no hay conexión o si el ack no
 * llega antes de `esperaMs`.
 */
export function emitirConAck(socket, evento, payload, esperaMs = 8000) {
	return new Promise((resolve, reject) => {
		if (!socket?.connected) {
			reject(new ErrorSala("sin_conexion"));
			return;
		}

		socket.timeout(esperaMs).emit(evento, payload, (errorDeTiempo, respuesta) => {
			if (errorDeTiempo) {
				reject(new ErrorSala("tiempo_agotado"));
			} else if (respuesta?.ok) {
				resolve(respuesta);
			} else {
				const error = respuesta?.error ?? {};
				reject(
					new ErrorSala(error.codigo ?? "error_interno", {
						mensajeServidor: error.mensaje,
						status: error.status,
						datos: error.datos,
					}),
				);
			}
		});
	});
}
