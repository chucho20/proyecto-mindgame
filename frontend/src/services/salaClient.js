import { crearSocket, emitirConAck, ErrorSala } from "./socket.js";
import { CODIGOS_DE_CONEXION_FATALES, graciaDeRol, mensajeDeCodigoSala } from "../utils/salaTiempoReal.js";

const ESPERA_DE_CONEXION_MS = 10_000;
const ESPERA_ENTRE_REINTENTOS_MS = 1500;
const MAX_REINTENTOS_DE_REUNION = 5;

// Eventos de presencia del servidor y su nombre en el reducer.
const PRESENCIAS = {
	"sala:participante_conectado": "conectado",
	"sala:participante_reconectado": "reconectado",
	"sala:participante_desconectado": "desconectado",
	"sala:participante_expirado": "expirado",
	"sala:participante_salio": "salio",
};

function esperarConexion(socket) {
	return new Promise((resolve, reject) => {
		if (socket.connected) {
			resolve();
			return;
		}

		function limpiar() {
			clearTimeout(temporizador);
			socket.off("connect", alConectar);
			socket.off("connect_error", alFallar);
		}

		function alConectar() {
			limpiar();
			resolve();
		}

		function alFallar(error) {
			limpiar();
			reject(new ErrorSala(error?.data?.codigo ?? "sin_conexion"));
		}

		const temporizador = setTimeout(() => {
			limpiar();
			reject(new ErrorSala("sin_conexion"));
		}, ESPERA_DE_CONEXION_MS);

		socket.once("connect", alConectar);
		socket.once("connect_error", alFallar);
	});
}

/**
 * Cliente de las salas en tiempo real: dueño de UN socket por sesión (no se conecta hasta que alguien
 * lo pide), traduce los eventos del servidor a acciones del reducer y reentra a la sala cuando el
 * socket se cae y vuelve. Es JavaScript plano (sin React): el hook `useSalaTiempoReal` le pasa los
 * callbacks de `notificar` y expone sus métodos.
 *
 * notificar: { dispatch, conexion, caida, errorConexion, aviso }. Las credenciales (token y rol del usuario)
 * se entregan al crear el cliente y se actualizan con `actualizarCredenciales` cuando cambia la sesión.
 */
export function crearClienteSala(notificar, credencialesIniciales) {
	let credenciales = credencialesIniciales;
	let socket = null;
	let conexionPendiente = null;
	let salaId = null;
	let caida = null;
	let temporizadorDeReunion = null;

	let ultimoAviso = 0;
	const obtenerToken = () => credenciales.token;

	// Aviso para la persona (`{ id, texto }`; el id distinto vuelve a anunciar un texto repetido).
	function avisar(texto) {
		ultimoAviso += 1;
		notificar.aviso(texto ? { id: ultimoAviso, texto } : null);
	}

	// --- Estado de la sala a la que pertenece el socket ---

	function soltarSala() {
		salaId = null;
		caida = null;
		clearTimeout(temporizadorDeReunion);
		notificar.caida(null);
	}

	function entrarEnSala(sala) {
		salaId = sala.id;
		caida = null;
		clearTimeout(temporizadorDeReunion);
		notificar.caida(null);
		notificar.dispatch({ tipo: "snapshot", sala, ahora: Date.now() });
	}

	function registrarCaida() {
		if (!caida) {
			caida = { desde: Date.now(), graciaMs: graciaDeRol(credenciales.rol) };
			notificar.caida(caida);
		}
	}

	// Una sala que ya no admite reentrar: se muestra la pantalla que corresponde. Devuelve si la resolvió.
	async function resolverSalaTerminada(s, id, error) {
		if (error.codigo === "sala_finalizada") {
			const { sala } = await emitirConAck(s, "sala:estado", { sala_id: id });
			soltarSala();
			notificar.dispatch({
				tipo: "finalizada",
				payload: { sala_id: id, resultados: sala.resultados ?? [], finalizada_en: sala.finalizada_en },
				forzar: true,
			});
			return true;
		}

		if (error.codigo === "sala_cerrada") {
			soltarSala();
			notificar.dispatch({
				tipo: "cerrada",
				payload: { sala_id: id, motivo: credenciales.rol === "docente" ? "docente_ausente" : "desconocido" },
				rol: credenciales.rol,
				forzar: true,
			});
			return true;
		}

		if (error.codigo === "sala_no_encontrada") {
			soltarSala();
			notificar.dispatch({ tipo: "no_encontrada", salaId: id });
			return true;
		}

		return false;
	}

	// Tras reconectar, el servidor no recuerda al socket nuevo: se vuelve a entrar con el sala_id y llega el snapshot.
	async function reunirse(s, intento) {
		const id = salaId;

		if (!id || socket !== s) {
			return;
		}

		try {
			const { sala } = await emitirConAck(s, "sala:unirse", { sala_id: id });

			if (socket !== s || salaId !== id) {
				return;
			}

			const estuvoCaido = caida;
			entrarEnSala(sala);

			if (estuvoCaido) {
				const demasiado = Date.now() - estuvoCaido.desde > estuvoCaido.graciaMs;
				avisar(
					demasiado
						? "Volviste a la sala, pero estuviste desconectado más tiempo del permitido: los demás pudieron ver que saliste."
						: "Te reconectaste y recuperamos el estado de la sala.",
				);
			}
		} catch (error) {
			if (socket !== s || salaId !== id || error.codigo === "sin_conexion") {
				// Se volvió a caer: el próximo `connect` repite la reunión.
				return;
			}

			const resuelta = await resolverSalaTerminada(s, id, error).catch(() => false);

			if (resuelta || socket !== s || salaId !== id) {
				return;
			}

			if (intento < MAX_REINTENTOS_DE_REUNION) {
				temporizadorDeReunion = setTimeout(() => reunirse(s, intento + 1), ESPERA_ENTRE_REINTENTOS_MS);
				return;
			}

			notificar.errorConexion({ codigo: error.codigo, mensaje: error.message });
		}
	}

	// --- Socket ---

	function destruirSocket() {
		const actual = socket;
		socket = null;
		conexionPendiente = null;
		clearTimeout(temporizadorDeReunion);

		if (actual) {
			actual.removeAllListeners();
			actual.disconnect();
		}

		notificar.conexion("desconectado");
	}

	function alFallarLaConexion(codigo) {
		destruirSocket();
		notificar.errorConexion({ codigo, mensaje: mensajeDeCodigoSala(codigo) });
		notificar.conexion("error");
	}

	function registrarEventos(s) {
		s.on("connect", () => {
			notificar.conexion("conectado");
			notificar.errorConexion(null);

			if (salaId) {
				reunirse(s, 0);
			}
		});

		s.on("disconnect", (motivo) => {
			if (socket !== s) {
				return;
			}

			if (salaId) {
				registrarCaida();
				notificar.conexion("reconectando");
			} else {
				notificar.conexion("desconectado");
			}

			// Si el servidor cortó la conexión, Socket.io no reintenta solo.
			if (motivo === "io server disconnect") {
				setTimeout(() => {
					if (socket === s && !s.active) {
						s.connect();
					}
				}, ESPERA_ENTRE_REINTENTOS_MS);
			}
		});

		s.on("connect_error", (error) => {
			const codigo = error?.data?.codigo;

			if (CODIGOS_DE_CONEXION_FATALES.includes(codigo)) {
				alFallarLaConexion(codigo);
			} else if (salaId) {
				notificar.conexion("reconectando");
			}
		});

		for (const [evento, tipo] of Object.entries(PRESENCIAS)) {
			s.on(evento, (payload) =>
				notificar.dispatch({ tipo: "presencia", evento: tipo, payload, ahora: Date.now() }),
			);
		}

		s.on("sala:sesion_reemplazada", (payload) => {
			if (payload?.sala_id === salaId) {
				soltarSala();
				notificar.dispatch({ tipo: "reemplazada" });
			}
		});

		s.on("sala:cerrada", (payload) => {
			if (payload?.sala_id === salaId) {
				soltarSala();
			}

			notificar.dispatch({ tipo: "cerrada", payload, rol: credenciales.rol });
		});

		s.on("actividad:instrucciones", (payload) => notificar.dispatch({ tipo: "instrucciones", payload }));
		s.on("actividad:iniciada", (payload) =>
			notificar.dispatch({ tipo: "iniciada", payload, ahora: Date.now() }),
		);
		s.on("actividad:evento", (payload) => notificar.dispatch({ tipo: "evento", payload }));
		s.on("actividad:resultado_participante", (payload) =>
			notificar.dispatch({ tipo: "resultado_participante", payload }),
		);
		s.on("actividad:recompensa", (payload) => notificar.dispatch({ tipo: "recompensa", payload }));
		s.on("actividad:finalizada", (payload) => {
			if (payload?.sala_id === salaId) {
				soltarSala();
			}

			notificar.dispatch({ tipo: "finalizada", payload });
		});
	}

	/** Conecta (una sola vez aunque se pida varias) y resuelve con el socket listo. */
	function conectar() {
		if (!obtenerToken()) {
			return Promise.reject(new ErrorSala("no_autorizado"));
		}

		if (socket?.connected) {
			return Promise.resolve(socket);
		}

		if (conexionPendiente) {
			return conexionPendiente;
		}

		if (!socket) {
			socket = crearSocket(obtenerToken);
			registrarEventos(socket);
		}

		const s = socket;

		if (!s.active) {
			s.connect();
		}

		notificar.conexion(salaId ? "reconectando" : "conectando");

		const pendiente = esperarConexion(s).then(
			() => s,
			(error) => {
				// Sin sala no tiene sentido seguir reintentando en segundo plano.
				if (!salaId && socket === s) {
					destruirSocket();
					notificar.conexion("error");
				}

				throw error;
			},
		);

		conexionPendiente = pendiente;

		const liberar = () => {
			if (conexionPendiente === pendiente) {
				conexionPendiente = null;
			}
		};
		pendiente.then(liberar, liberar);

		return pendiente;
	}

	// --- Acciones ---

	async function crearSala({ grupoId, actividadId, capacidadMinima }) {
		const s = await conectar();
		const { sala } = await emitirConAck(s, "sala:crear", {
			grupo_id: Number(grupoId),
			actividad_id: Number(actividadId),
			...(capacidadMinima ? { capacidad_minima: Number(capacidadMinima) } : {}),
		});
		entrarEnSala(sala);
		return sala;
	}

	async function unirseASala({ salaId: id, codigo }) {
		const s = await conectar();
		const { sala } = await emitirConAck(s, "sala:unirse", id ? { sala_id: Number(id) } : { codigo });
		entrarEnSala(sala);
		return sala;
	}

	/**
	 * Recupera una sala al abrir su pantalla (recarga o enlace): entra con el sala_id y, si ya terminó o se
	 * cerró, deja el estado final listo. Devuelve "ok", "finalizada", "cerrada" o "no_encontrada"; el resto de
	 * los errores se lanzan.
	 */
	async function restaurarSala(id) {
		const s = await conectar();

		try {
			const { sala } = await emitirConAck(s, "sala:unirse", { sala_id: Number(id) });
			entrarEnSala(sala);
			return "ok";
		} catch (error) {
			if (error.codigo === "sala_finalizada") {
				await resolverSalaTerminada(s, Number(id), error);
				return "finalizada";
			}

			if (error.codigo === "sala_cerrada") {
				await resolverSalaTerminada(s, Number(id), error);
				return "cerrada";
			}

			if (error.codigo === "sala_no_encontrada") {
				await resolverSalaTerminada(s, Number(id), error);
				return "no_encontrada";
			}

			throw error;
		}
	}

	async function listarDisponibles() {
		const s = await conectar();
		const { salas } = await emitirConAck(s, "sala:listar_disponibles");
		return salas;
	}

	async function salirDeSala() {
		const id = salaId;

		if (!id) {
			return;
		}

		await emitirConAck(socket, "sala:salir", { sala_id: id });
		soltarSala();
		notificar.dispatch({ tipo: "reiniciar" });
	}

	async function cerrarSala() {
		const id = salaId;
		await emitirConAck(socket, "sala:cerrar", { sala_id: id });
		soltarSala();
		notificar.dispatch({ tipo: "cerrada", payload: { sala_id: id, motivo: "docente" }, rol: "docente" });
	}

	async function definirInstrucciones(instrucciones) {
		const respuesta = await emitirConAck(socket, "actividad:instrucciones", {
			sala_id: salaId,
			instrucciones,
		});
		return respuesta.instrucciones;
	}

	async function iniciarActividad() {
		const id = salaId;
		const respuesta = await emitirConAck(socket, "actividad:iniciar", { sala_id: id });
		notificar.dispatch({
			tipo: "iniciada",
			payload: { sala_id: id, iniciada_en: respuesta.iniciada_en, servidor_ahora: respuesta.servidor_ahora },
			ahora: Date.now(),
		});
	}

	async function enviarEvento(tipo, datos) {
		const respuesta = await emitirConAck(socket, "actividad:evento", {
			sala_id: salaId,
			tipo,
			...(datos ? { datos } : {}),
		});
		return respuesta.secuencia;
	}

	async function enviarResultado(resultado) {
		await emitirConAck(socket, "actividad:resultado", { sala_id: salaId, resultado });
	}

	// Se manda sala_id para que un reintento funcione aunque la sala ya no esté en memoria (es idempotente).
	async function finalizarActividad(idDeSala) {
		const id = idDeSala ?? salaId;
		const respuesta = await emitirConAck(socket, "actividad:finalizar", { sala_id: id }, 15_000);
		soltarSala();
		notificar.dispatch({
			tipo: "finalizada",
			payload: { sala_id: id, resultados: respuesta.resultados, finalizada_en: respuesta.finalizada_en },
		});
	}

	/** Sale de la pantalla de la sala: corta la conexión y deja todo en blanco. */
	function reiniciar() {
		destruirSocket();
		soltarSala();
		notificar.errorConexion(null);
		avisar(null);
		notificar.dispatch({ tipo: "reiniciar" });
	}

	/** Limpieza al desmontar o cerrar sesión: cierra el socket sin tocar el estado de React. */
	function destruir() {
		destruirSocket();
		soltarSala();
	}

	return {
		actualizarCredenciales(nuevas) {
			credenciales = nuevas;
		},
		conectar,
		crearSala,
		unirseASala,
		restaurarSala,
		listarDisponibles,
		salirDeSala,
		cerrarSala,
		definirInstrucciones,
		iniciarActividad,
		enviarEvento,
		enviarResultado,
		finalizarActividad,
		reiniciar,
		destruir,
	};
}
