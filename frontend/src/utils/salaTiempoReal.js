// Lógica pura de las actividades grupales en tiempo real (RF-019): mensajes en español de los códigos
// de error, tiempos, orden de eventos y el reducer que mantiene el estado de la sala a partir de
// lo que llega por Socket.io. No usa React ni la red: se puede probar con datos sueltos.

// Tiempo que el servidor espera a un participante caído antes de darlo por salido (ver backend/src/constants/salas.js).
export const GRACIA_ESTUDIANTE_MS = 30_000;
export const GRACIA_DOCENTE_MS = 60_000;

// Eventos que se conservan en pantalla (el servidor guarda 100 para el snapshot).
export const MAX_EVENTOS_EN_PANTALLA = 200;
export const MAX_NOVEDADES = 30;

// Errores del handshake que no se arreglan reintentando: hay que iniciar sesión de nuevo o cerrar pestañas.
export const CODIGOS_DE_CONEXION_FATALES = [
	"no_autorizado",
	"token_invalido",
	"rol_no_permitido",
	"demasiadas_conexiones",
];

const MENSAJES_DE_ERROR = {
	no_autorizado: "Tu sesión no es válida. Iniciá sesión de nuevo.",
	token_invalido: "Tu sesión venció o no es válida. Iniciá sesión de nuevo.",
	sesion_expirada: "Tu sesión venció. Iniciá sesión de nuevo.",
	rol_no_permitido: "Tu rol no puede participar en actividades en vivo.",
	demasiadas_conexiones: "Tenés demasiadas pestañas abiertas con tu cuenta. Cerrá alguna e intentá de nuevo.",
	prohibido: "No tenés permiso para hacer eso.",
	sala_no_encontrada:
		"No encontramos esa sala. Revisá el código o pedile a tu docente que la abra y que te lo comparta.",
	grupo_no_encontrado: "No encontramos ese grupo. Puede que no sea uno de tus grupos.",
	actividad_no_encontrada: "No encontramos esa actividad o ya no está disponible.",
	ya_en_otra_sala: "Ya estás en otra sala. Volvé a ella antes de entrar a una nueva.",
	sala_llena: "La sala está llena. Avisale a tu docente.",
	grupo_con_sala_activa: "Este grupo ya tiene una sala abierta. Volvé a ella o ciérrala antes de crear otra.",
	estado_invalido: "Esa acción no está disponible en este momento de la actividad.",
	operacion_en_curso: "Hay otra operación en curso en la sala. Probá de nuevo en un instante.",
	no_estas_en_sala: "No estás en ninguna sala.",
	sala_incorrecta: "Esa acción corresponde a otra sala.",
	actividad_no_iniciada: "La actividad todavía no empezó o ya terminó.",
	sala_cerrada: "Esta sala fue cerrada.",
	sala_finalizada: "La actividad de esta sala ya terminó.",
	payload_demasiado_grande: "El mensaje es demasiado largo. Acortalo e intentá de nuevo.",
	demasiadas_solicitudes: "Estás enviando mensajes muy rápido. Esperá unos segundos e intentá de nuevo.",
	conexion_perdida: "Se perdió la conexión mientras se procesaba tu pedido. Intentá de nuevo.",
	sin_conexion: "No hay conexión con el servidor en este momento. Esperá a que se recupere.",
	tiempo_agotado: "El servidor tardó demasiado en responder. Revisá tu conexión e intentá de nuevo.",
	no_encontrado: "No encontramos lo que buscabas.",
	error_interno: "Ocurrió un error inesperado. Intentá de nuevo más tarde.",
};

// Códigos cuyo mensaje del servidor es más específico que el genérico (dicen qué campo falló).
const USAR_MENSAJE_DEL_SERVIDOR = new Set(["payload_invalido"]);

/** Mensaje en español para un código de error del servidor o del cliente. */
export function mensajeDeCodigoSala(codigo, { mensajeServidor, datos } = {}) {
	if (codigo === "capacidad_minima_no_alcanzada" && datos) {
		return `Faltan estudiantes: hacen falta ${datos.requeridos} conectados y hay ${datos.conectados}.`;
	}

	if (USAR_MENSAJE_DEL_SERVIDOR.has(codigo) && mensajeServidor) {
		return mensajeServidor;
	}

	return (
		MENSAJES_DE_ERROR[codigo] ??
		mensajeServidor ??
		"No pudimos completar la acción. Intentá de nuevo en unos segundos."
	);
}

/** Mensaje de un error cualquiera lanzado por las acciones de sala (ErrorSala u otro). */
export function mensajeDeErrorSala(error, fallback = "No pudimos completar la acción. Intentá de nuevo.") {
	return error?.name === "ErrorSala" && error.message ? error.message : fallback;
}

const MOTIVOS_DE_CIERRE = {
	docente: {
		estudiante: "Tu docente cerró la sala. La actividad no se completó y no se otorgaron puntos.",
		docente: "Cerraste la sala. La actividad no se completó y no se otorgaron puntos.",
	},
	docente_ausente: {
		estudiante: "La sala se cerró porque tu docente se desconectó y no volvió a tiempo.",
		docente: "La sala se cerró porque pasó el tiempo de espera sin que volvieras a conectarte.",
	},
	tiempo_agotado: {
		estudiante: "La sala se cerró por llevar demasiado tiempo abierta.",
		docente: "La sala se cerró por llevar demasiado tiempo abierta.",
	},
};

/** Texto de la pantalla de sala cerrada según el motivo y el rol de quien la ve. */
export function mensajeDeCierre(motivo, rol) {
	const textos = MOTIVOS_DE_CIERRE[motivo];

	if (!textos) {
		return "La sala fue cerrada y la actividad no se completó.";
	}

	return rol === "docente" ? textos.docente : textos.estudiante;
}

// --- Tiempo ---

/** Diferencia entre el reloj del servidor y el local: `servidor ≈ local + desfase`. */
export function calcularDesfase(servidorAhoraIso, ahoraLocalMs) {
	const servidor = Date.parse(servidorAhoraIso);

	return Number.isFinite(servidor) ? servidor - ahoraLocalMs : 0;
}

/** Milisegundos desde que arrancó la actividad, medidos con el reloj del servidor (no el del equipo). */
export function milisegundosTranscurridos(iniciadaEnIso, desfaseMs, ahoraLocalMs) {
	const inicio = Date.parse(iniciadaEnIso);

	if (!Number.isFinite(inicio)) {
		return 0;
	}

	return Math.max(0, ahoraLocalMs + desfaseMs - inicio);
}

/** `mm:ss`, o `h:mm:ss` si pasa de la hora. */
export function formatearCronometro(milisegundos) {
	const total = Math.max(0, Math.floor(milisegundos / 1000));
	const horas = Math.floor(total / 3600);
	const minutos = Math.floor((total % 3600) / 60);
	const segundos = total % 60;
	const dos = (valor) => String(valor).padStart(2, "0");

	return horas > 0 ? `${horas}:${dos(minutos)}:${dos(segundos)}` : `${dos(minutos)}:${dos(segundos)}`;
}

/** Segundos que faltan para `desde + graciaMs` (nunca negativo). */
export function segundosRestantes(desdeMs, graciaMs, ahoraMs) {
	return Math.max(0, Math.ceil((desdeMs + graciaMs - ahoraMs) / 1000));
}

export function graciaDeRol(rol) {
	return rol === "docente" ? GRACIA_DOCENTE_MS : GRACIA_ESTUDIANTE_MS;
}

// --- Eventos y participantes ---

/** Une eventos nuevos a la lista, ordenados por `secuencia` y sin repetir (los reenvíos del snapshot). */
export function insertarEventos(actuales, nuevos, maximo = MAX_EVENTOS_EN_PANTALLA) {
	const porSecuencia = new Map();

	for (const evento of [...actuales, ...(nuevos ?? [])]) {
		if (evento && Number.isFinite(evento.secuencia)) {
			porSecuencia.set(evento.secuencia, evento);
		}
	}

	return [...porSecuencia.values()].sort((a, b) => a.secuencia - b.secuencia).slice(-maximo);
}

export function contarEstudiantes(participantes, { soloConectados = false } = {}) {
	return participantes.filter(
		(participante) => participante.rol === "estudiante" && (!soloConectados || participante.conectado),
	).length;
}

/** Cuántos estudiantes conectados hacen falta (y hay) para poder iniciar la actividad. */
export function requisitoDeInicio(sala, participantes) {
	const requeridos = Math.max(1, sala?.capacidad_minima ?? 1);
	const conectados = contarEstudiantes(participantes, { soloConectados: true });

	return { requeridos, conectados, puedeIniciar: conectados >= requeridos };
}

/** Texto de un evento del feed según su `tipo` (los tipos son libres: los desconocidos se muestran genéricos). */
export function textoDeEvento(evento) {
	const nombre = evento.nombre_usuario || "Alguien";
	const texto = typeof evento.datos?.texto === "string" ? evento.datos.texto : "";

	switch (evento.tipo) {
		case "listo":
			return `${nombre} está listo.`;
		case "aporte":
			return texto ? `${nombre} aportó: «${texto}»` : `${nombre} hizo un aporte.`;
		case "termino":
			return `${nombre} terminó.`;
		case "aviso":
			return texto ? `Aviso de ${nombre}: ${texto}` : `${nombre} envió un aviso.`;
		default:
			return `${nombre} envió «${evento.tipo}».`;
	}
}

/** Usuarios que ya informaron que terminaron (por su `termino` en el feed o por su resultado recibido). */
export function idsQueTerminaron(eventos, resultados) {
	const ids = new Set(Object.keys(resultados).map(Number));

	for (const evento of eventos) {
		if (evento.tipo === "termino") {
			ids.add(evento.usuario_id);
		}
	}

	return ids;
}

// --- Reducer ---

export const estadoInicialSala = {
	sala: null,
	participantes: [],
	eventos: [],
	resultados: {},
	graciaPorUsuario: {},
	novedades: [],
	desfaseMs: 0,
	fin: null,
	recompensa: null,
	anuncio: null,
	contador: 0,
};

function nombreDe(participantes, usuarioId) {
	return participantes.find((participante) => participante.usuario_id === usuarioId)?.nombre_usuario;
}

// Agrega una novedad visible (y anunciable para lectores de pantalla).
function conNovedad(estado, texto, tipo, { anunciar = true } = {}) {
	const id = estado.contador + 1;

	return {
		...estado,
		contador: id,
		novedades: [...estado.novedades, { id, texto, tipo }].slice(-MAX_NOVEDADES),
		anuncio: anunciar ? { id, texto } : estado.anuncio,
	};
}

// Estado sobre el que se aplica un cierre o un fin de la sala `salaId`. Si el estado es de otra sala viva se
// ignora (devuelve null), salvo que `forzar` indique que se está abriendo una sala terminada (recarga de la página).
function baseTerminal(estado, salaId, forzar) {
	const vacia = { id: salaId, estado: "cerrada", actividad: null, grupo: null };

	if (!estado.sala) {
		return { ...estado, sala: vacia };
	}

	if (estado.sala.id === salaId) {
		return estado;
	}

	return forzar
		? { ...estadoInicialSala, contador: estado.contador, anuncio: estado.anuncio, sala: vacia }
		: null;
}

function sinGracia(graciaPorUsuario, usuarioId) {
	const copia = { ...graciaPorUsuario };
	delete copia[usuarioId];
	return copia;
}

function aplicarPresencia(estado, { evento, payload, ahora }) {
	if (!estado.sala || payload.sala_id !== estado.sala.id) {
		return estado;
	}

	const usuarioId = payload.usuario_id;
	const nombre =
		payload.participante?.nombre_usuario ?? nombreDe(estado.participantes, usuarioId) ?? "Alguien";
	const base = {
		...estado,
		participantes: payload.participantes ?? estado.participantes,
		graciaPorUsuario: sinGracia(estado.graciaPorUsuario, usuarioId),
	};

	switch (evento) {
		case "conectado":
			return conNovedad(base, `${nombre} se unió a la sala.`, "entrada");
		case "reconectado":
			return conNovedad(base, `${nombre} volvió a conectarse.`, "entrada");
		case "desconectado": {
			const graciaMs = Number.isFinite(payload.gracia_ms) ? payload.gracia_ms : graciaDeRol(payload.rol);

			return conNovedad(
				{ ...base, graciaPorUsuario: { ...base.graciaPorUsuario, [usuarioId]: { desde: ahora, graciaMs } } },
				`${nombre} se desconectó. Tiene ${Math.round(graciaMs / 1000)} segundos para volver.`,
				"desconexion",
			);
		}
		case "expirado":
			return conNovedad(base, `${nombre} no volvió a tiempo y salió de la sala.`, "expiro");
		case "salio":
			return conNovedad(base, `${nombre} salió de la sala.`, "salida");
		default:
			return estado;
	}
}

/**
 * Estado de la sala a partir de lo que llega del servidor. Acciones:
 * `snapshot` (ack de crear/unirse), `presencia` (eventos `sala:participante_*`), `instrucciones`,
 * `iniciada`, `evento`, `resultado_participante`, `finalizada`, `recompensa`, `cerrada`,
 * `reemplazada`, `reiniciar`. `ahora` es el reloj local en ms (se pasa para mantener esto puro).
 */
export function salaReducer(estado, accion) {
	switch (accion.tipo) {
		case "snapshot": {
			const {
				participantes = [],
				eventos_recientes: eventosRecientes = [],
				servidor_ahora: servidorAhora,
				...sala
			} = accion.sala;
			const mismaSala = estado.sala?.id === sala.id;
			const base = mismaSala
				? estado
				: { ...estadoInicialSala, contador: estado.contador, anuncio: estado.anuncio };
			const gracia = { ...base.graciaPorUsuario };

			for (const participante of participantes) {
				if (participante.conectado) {
					delete gracia[participante.usuario_id];
				} else if (!gracia[participante.usuario_id]) {
					gracia[participante.usuario_id] = { desde: accion.ahora, graciaMs: graciaDeRol(participante.rol) };
				}
			}

			return {
				...base,
				sala,
				participantes,
				eventos: insertarEventos(base.eventos, eventosRecientes),
				graciaPorUsuario: gracia,
				desfaseMs: calcularDesfase(servidorAhora, accion.ahora),
				fin: null,
			};
		}

		case "presencia":
			return aplicarPresencia(estado, accion);

		case "instrucciones":
			if (!estado.sala || accion.payload.sala_id !== estado.sala.id) {
				return estado;
			}

			return conNovedad(
				{ ...estado, sala: { ...estado.sala, instrucciones: accion.payload.instrucciones } },
				"Se actualizaron las instrucciones.",
				"instrucciones",
			);

		case "iniciada": {
			const { payload, ahora } = accion;

			if (
				!estado.sala ||
				payload.sala_id !== estado.sala.id ||
				estado.sala.iniciada_en === payload.iniciada_en
			) {
				return estado;
			}

			return conNovedad(
				{
					...estado,
					sala: {
						...estado.sala,
						estado: "en_curso",
						iniciada_en: payload.iniciada_en,
						instrucciones: payload.instrucciones ?? estado.sala.instrucciones,
					},
					desfaseMs: calcularDesfase(payload.servidor_ahora, ahora),
				},
				"¡La actividad comenzó!",
				"inicio",
			);
		}

		case "evento": {
			if (!estado.sala || accion.payload.sala_id !== estado.sala.id) {
				return estado;
			}

			return {
				...estado,
				sala: { ...estado.sala, secuencia: Math.max(estado.sala.secuencia ?? 0, accion.payload.secuencia) },
				eventos: insertarEventos(estado.eventos, [accion.payload]),
			};
		}

		case "resultado_participante": {
			if (!estado.sala || accion.payload.sala_id !== estado.sala.id) {
				return estado;
			}

			const { usuario_id: usuarioId, nombre_usuario: nombreUsuario, resultado } = accion.payload;

			return {
				...estado,
				resultados: {
					...estado.resultados,
					[usuarioId]: { usuario_id: usuarioId, nombre_usuario: nombreUsuario, resultado },
				},
			};
		}

		case "finalizada": {
			const base = baseTerminal(estado, accion.payload.sala_id, accion.forzar);

			if (!base || base.fin?.tipo === "finalizada") {
				return base ?? estado;
			}

			return conNovedad(
				{
					...base,
					sala: { ...base.sala, estado: "finalizada" },
					fin: {
						tipo: "finalizada",
						resultados: accion.payload.resultados ?? [],
						finalizada_en: accion.payload.finalizada_en ?? null,
					},
				},
				"La actividad terminó.",
				"fin",
			);
		}

		case "recompensa":
			return { ...estado, recompensa: accion.payload };

		case "cerrada": {
			const base = baseTerminal(estado, accion.payload.sala_id, accion.forzar);

			if (!base || base.fin) {
				return base ?? estado;
			}

			const texto = accion.rol ? mensajeDeCierre(accion.payload.motivo, accion.rol) : "La sala fue cerrada.";

			return conNovedad(
				{ ...base, fin: { tipo: "cerrada", motivo: accion.payload.motivo } },
				texto,
				"cierre",
			);
		}

		case "reemplazada":
			return conNovedad(
				{ ...estado, fin: { tipo: "reemplazada" } },
				"Entraste a la sala desde otra pestaña o dispositivo.",
				"reemplazo",
			);

		case "no_encontrada": {
			const base = baseTerminal(estado, accion.salaId, true);

			return { ...base, fin: { tipo: "no_encontrada" } };
		}

		case "reiniciar":
			return { ...estadoInicialSala, contador: estado.contador };

		default:
			return estado;
	}
}

/** Resumen en una línea del resultado que informó un estudiante (objeto libre `clave: valor`). */
export function resumenDeResultado(resultado) {
	if (!resultado || typeof resultado !== "object") {
		return "—";
	}

	const partes = Object.entries(resultado).map(([clave, valor]) => {
		const etiqueta = clave.replace(/_/g, " ");

		if (typeof valor === "boolean") {
			return valor ? etiqueta : `no ${etiqueta}`;
		}

		return `${etiqueta}: ${typeof valor === "object" ? JSON.stringify(valor) : valor}`;
	});

	return partes.length > 0 ? partes.join(" · ") : "—";
}
