import crypto from "node:crypto";

import AppError from "../utils/AppError.js";
import { esViolacionUnica } from "../utils/dbErrors.js";
import { normalizarId } from "../utils/dbIds.js";
import { registrarError } from "../utils/logger.js";
import { esEnteroValido } from "../utils/validators.js";
import {
	ALFABETO_CODIGO_SALA,
	LONGITUD_CODIGO_SALA,
	MAX_BYTES_DATOS,
	MAX_LONGITUD_INSTRUCCIONES,
	MAX_PARTICIPANTES,
	MAX_VIDA_SALA_MS,
	MAXIMO_INTENTOS_CODIGO_SALA,
	REGEX_TIPO_EVENTO,
} from "../constants/salas.js";
import * as actividadRepository from "../repositories/actividad.repository.js";
import * as grupoEstudianteRepository from "../repositories/grupoEstudiante.repository.js";
import * as participacionGrupalRepository from "../repositories/participacionGrupal.repository.js";
import * as salaRepository from "../repositories/sala.repository.js";
import * as usuarioRepository from "../repositories/usuario.repository.js";
import * as actividadService from "./actividad.service.js";
import * as grupoService from "./grupo.service.js";
import * as registro from "../sockets/salas.manager.js";

/**
 * Lógica de las actividades grupales en tiempo real (RF-019). Los handlers de Socket.io son
 * delgados: validan el formato del mensaje y llaman acá. Este módulo no conoce a `io`; para
 * difundir eventos usa el "emisor" que registra `game.socket.js` con `configurarEmisor`.
 *
 * Reglas que atraviesan todo el módulo:
 *  - La identidad (`usuario = { id, rol }`) sale SIEMPRE del handshake autenticado, nunca del payload.
 *  - Una sala ajena y una inexistente responden igual (404), para no revelar qué salas existen.
 *  - Las transiciones de estado (iniciar, finalizar, cerrar) se ejecutan de a una por sala.
 */

// Error de negocio de las salas: lleva un `codigo` estable (para que el cliente decida qué mostrar)
// y, opcionalmente, `datos` con contexto (por ejemplo, cuántos participantes faltan).
export class ErrorDeSala extends AppError {
	constructor(codigo, mensaje, statusCode = 400, datos = null) {
		super(mensaje, statusCode);
		this.name = "ErrorDeSala";
		this.codigo = codigo;
		this.datos = datos;
	}
}

// --- Emisor (puente hacia Socket.io) ---

let emisor = null;

/**
 * Registra las operaciones de salida. `game.socket.js` las implementa con `io`:
 * `aSala(salaId, evento, payload, { excepto })`, `aSocket(socketId, evento, payload)`,
 * `unirSocket(socketId, salaId)`, `sacarSocket(socketId, salaId)` y `vaciarSala(salaId)`.
 */
export function configurarEmisor(implementacion) {
	emisor = implementacion;
}

// --- Utilidades ---

function generarCodigo() {
	let codigo = "";
	for (let i = 0; i < LONGITUD_CODIGO_SALA; i += 1) {
		codigo += ALFABETO_CODIGO_SALA[crypto.randomInt(ALFABETO_CODIGO_SALA.length)];
	}
	return codigo;
}

function salaNoEncontrada() {
	return new ErrorDeSala("sala_no_encontrada", "Sala no encontrada.", 404);
}

function exigirDocente(usuario) {
	if (usuario.rol !== "docente") {
		throw new ErrorDeSala("prohibido", "Solo un docente puede hacer esto.", 403);
	}
}

function exigirEstudiante(usuario) {
	if (usuario.rol !== "estudiante") {
		throw new ErrorDeSala("prohibido", "Solo un estudiante puede hacer esto.", 403);
	}
}

function exigirObjeto(payload) {
	if (payload === undefined || payload === null) {
		return {};
	}

	if (typeof payload !== "object" || Array.isArray(payload)) {
		throw new ErrorDeSala("payload_invalido", "El mensaje debe ser un objeto.", 400);
	}

	return payload;
}

function esObjetoPlano(valor) {
	return valor !== null && typeof valor === "object" && Object.getPrototypeOf(valor) === Object.prototype;
}

// Datos libres que mandan los clientes (acciones y resultados): objeto plano y de tamaño acotado.
function validarDatosLibres(valor, campo) {
	if (valor === undefined) {
		return {};
	}

	if (!esObjetoPlano(valor)) {
		throw new ErrorDeSala("payload_invalido", `El campo "${campo}" debe ser un objeto.`, 400);
	}

	let texto;
	try {
		texto = JSON.stringify(valor);
	} catch (_error) {
		throw new ErrorDeSala("payload_invalido", `El campo "${campo}" no es válido.`, 400);
	}

	if (Buffer.byteLength(texto) > MAX_BYTES_DATOS) {
		throw new ErrorDeSala(
			"payload_demasiado_grande",
			`El campo "${campo}" no puede superar los ${MAX_BYTES_DATOS} bytes.`,
			413,
		);
	}

	return valor;
}

function leerIdObligatorio(valor, campo) {
	const id = normalizarId(valor);

	if (id === null) {
		throw new ErrorDeSala("payload_invalido", `El campo "${campo}" debe ser un id válido.`, 400);
	}

	return id;
}

// Usuario autenticado + datos visibles en la sala. Se consulta la base para que un usuario borrado o
// con el rol cambiado desde que se emitió su token no pueda operar.
async function cargarUsuario(usuario) {
	const fila = await usuarioRepository.findById(usuario.id);

	if (!fila || fila.rol !== usuario.rol) {
		throw new ErrorDeSala("no_autorizado", "Tu sesión ya no es válida. Iniciá sesión de nuevo.", 401);
	}

	return { id: fila.id, rol: fila.rol, nombreUsuario: fila.nombre_usuario, avatar: fila.avatar };
}

// La sala puede cerrarse o finalizarse mientras otra operación espera la base de datos.
function asegurarAbierta(sala) {
	if (registro.obtenerSala(sala.id) !== sala || sala.finalizacion) {
		throw new ErrorDeSala("sala_cerrada", "La sala ya no está disponible.", 410);
	}
}

// Sala (en memoria) a la que se refiere un evento: la del payload o, si no la indica, la del socket.
function localizarSala(socketId, datos) {
	if (datos.sala_id !== undefined) {
		return registro.obtenerSala(leerIdObligatorio(datos.sala_id, "sala_id"));
	}

	const contexto = registro.obtenerContextoPorSocket(socketId);
	return contexto ? registro.obtenerSala(contexto.salaId) : null;
}

// Sala del docente dueño (404 si no existe o es de otro docente).
function exigirSalaDelDocente(usuario, socketId, datos) {
	exigirDocente(usuario);
	const sala = localizarSala(socketId, datos);

	if (!sala || sala.docenteId !== usuario.id) {
		throw salaNoEncontrada();
	}

	return sala;
}

// Sala y participante dueños del socket que emite; el `sala_id` del payload, si viene, debe coincidir.
function exigirParticipanteDelSocket(usuario, socketId, datos) {
	const contexto = registro.obtenerContextoPorSocket(socketId);

	if (!contexto || contexto.usuarioId !== usuario.id) {
		throw new ErrorDeSala("no_estas_en_sala", "No estás en ninguna sala. Unite a una primero.", 409);
	}

	if (datos.sala_id !== undefined && leerIdObligatorio(datos.sala_id, "sala_id") !== contexto.salaId) {
		throw new ErrorDeSala("sala_incorrecta", "Ese mensaje no corresponde a tu sala actual.", 409);
	}

	const sala = registro.obtenerSala(contexto.salaId);
	const participante = sala?.participantes.get(usuario.id);

	if (!sala || !participante || participante.socketId !== socketId || participante.abandono) {
		throw new ErrorDeSala("no_estas_en_sala", "No estás en ninguna sala. Unite a una primero.", 409);
	}

	return { sala, participante };
}

async function conBloqueo(sala, operacion) {
	if (sala.ocupada) {
		throw new ErrorDeSala(
			"operacion_en_curso",
			"Hay otra operación en curso en la sala. Intentá de nuevo.",
			409,
		);
	}

	sala.ocupada = true;
	try {
		return await operacion();
	} finally {
		sala.ocupada = false;
	}
}

function aIso(fecha) {
	return fecha ? new Date(fecha).toISOString() : null;
}

// Vista de la sala para quien está dentro (ack de unirse/crear y `sala:estado`). El código solo lo ve el docente.
function aSnapshot(sala, usuario) {
	return {
		id: sala.id,
		...(usuario.rol === "docente" ? { codigo: sala.codigo } : {}),
		estado: sala.estado,
		actividad: sala.actividad,
		grupo: sala.grupo,
		docente_id: sala.docenteId,
		capacidad_minima: sala.capacidadMinima,
		instrucciones: sala.instrucciones,
		iniciada_en: aIso(sala.iniciadaEn),
		servidor_ahora: new Date().toISOString(),
		secuencia: sala.secuencia,
		participantes: registro.listarParticipantes(sala),
		eventos_recientes: [...sala.eventos],
	};
}

function aResumenDeSala(sala, usuario) {
	return {
		sala_id: sala.id,
		...(usuario.rol === "docente" ? { codigo: sala.codigo } : {}),
		estado: sala.estado,
		actividad: { id: sala.actividad.id, titulo: sala.actividad.titulo },
		grupo: sala.grupo,
		capacidad_minima: sala.capacidadMinima,
		total_estudiantes: registro.contarEstudiantes(sala),
	};
}

function emitirParticipantes(sala, evento, datos, opciones) {
	emisor.aSala(
		sala.id,
		evento,
		{ sala_id: sala.id, ...datos, participantes: registro.listarParticipantes(sala) },
		opciones,
	);
}

// Cierra la sala en memoria: avisa a todos, saca los sockets de la room y libera el registro.
function difundirCierre(sala, motivo) {
	emisor.aSala(sala.id, "sala:cerrada", { sala_id: sala.id, motivo });
	emisor.vaciarSala(sala.id);
	registro.eliminarSala(sala.id);
}

// --- Crear y listar ---

/** El docente crea la sala de una actividad para UNO de sus grupos y queda dentro como anfitrión. */
export async function crearSala(usuarioJwt, socketId, payload) {
	exigirDocente(usuarioJwt);
	const datos = exigirObjeto(payload);

	const grupoId = leerIdObligatorio(datos.grupo_id, "grupo_id");
	const actividadId = leerIdObligatorio(datos.actividad_id, "actividad_id");

	let capacidadMinima = 1;
	if (datos.capacidad_minima !== undefined) {
		if (
			!esEnteroValido(datos.capacidad_minima, { min: 1 }) ||
			Number(datos.capacidad_minima) > MAX_PARTICIPANTES
		) {
			throw new ErrorDeSala(
				"payload_invalido",
				`La capacidad mínima debe ser un entero entre 1 y ${MAX_PARTICIPANTES}.`,
				400,
			);
		}
		capacidadMinima = Number(datos.capacidad_minima);
	}

	const enSala = registro.obtenerSalaDeUsuario(usuarioJwt.id);
	if (enSala) {
		throw new ErrorDeSala("ya_en_otra_sala", "Ya tenés una sala abierta. Cerrala antes de crear otra.", 409, {
			sala_id: enSala.id,
		});
	}

	// Reserva síncrona del docente: dos "crear" simultáneos suyos (aunque sean de grupos distintos) no pasan ambos.
	if (!registro.reservarDocente(usuarioJwt.id)) {
		throw new ErrorDeSala("operacion_en_curso", "Ya estás creando una sala. Esperá un momento.", 409);
	}

	try {
		return await crearSalaReservada(usuarioJwt, socketId, { grupoId, actividadId, capacidadMinima });
	} finally {
		registro.liberarDocente(usuarioJwt.id);
	}
}

async function crearSalaReservada(usuarioJwt, socketId, { grupoId, actividadId, capacidadMinima }) {
	const usuario = await cargarUsuario(usuarioJwt);

	let grupo;
	try {
		grupo = await grupoService.obtenerGrupoPropio(usuario.id, grupoId);
	} catch (error) {
		if (error instanceof AppError && error.statusCode === 404) {
			throw new ErrorDeSala("grupo_no_encontrado", "Grupo no encontrado.", 404);
		}
		throw error;
	}

	// Reserva síncrona: dos "crear" simultáneos para el mismo grupo no pasan ambos.
	if (!registro.reservarGrupo(grupo.id)) {
		throw new ErrorDeSala("grupo_con_sala_activa", "Ese grupo ya tiene una sala abierta.", 409);
	}

	try {
		const actividad = await actividadRepository.findById(actividadId);

		if (!actividad || actividad.estado !== "activa") {
			throw new ErrorDeSala("actividad_no_encontrada", "Actividad no encontrada.", 404);
		}

		// Otro "crear" del mismo docente pudo completarse mientras se esperaba la base de datos.
		if (registro.obtenerSalaDeUsuario(usuario.id)) {
			throw new ErrorDeSala(
				"ya_en_otra_sala",
				"Ya tenés una sala abierta. Cerrala antes de crear otra.",
				409,
			);
		}

		const fila = await crearFilaConCodigo({
			actividadId: actividad.id,
			grupoId: grupo.id,
			docenteId: usuario.id,
			capacidadMinima,
		});

		// El socket pudo caerse mientras se esperaba la base de datos: no se registra a un participante fantasma.
		if (!emisor.estaConectado(socketId)) {
			await salaRepository.cerrar(fila.id);
			throw new ErrorDeSala("conexion_perdida", "Se perdió la conexión mientras se creaba la sala.", 409);
		}

		const sala = registro.registrarSala({
			id: fila.id,
			codigo: fila.codigo,
			actividad: {
				id: actividad.id,
				titulo: actividad.titulo,
				descripcion: actividad.descripcion,
				tipo: actividad.tipo,
			},
			grupo: { id: grupo.id, nombre: grupo.nombre },
			docenteId: usuario.id,
			capacidadMinima,
			instrucciones: actividad.descripcion ?? null,
		});

		registro.agregarParticipante(sala, usuario, socketId);
		emisor.unirSocket(socketId, sala.id);

		return { sala: aSnapshot(sala, usuario) };
	} finally {
		registro.liberarGrupo(grupo.id);
	}
}

async function crearFilaConCodigo(datos) {
	for (let intento = 0; intento < MAXIMO_INTENTOS_CODIGO_SALA; intento += 1) {
		try {
			return await salaRepository.create({ ...datos, codigo: generarCodigo() });
		} catch (error) {
			// El UNIQUE del código es la fuente de verdad: si dos salas sortean el mismo código, la
			// base rechaza a la segunda y se reintenta con otro.
			if (!esViolacionUnica(error)) {
				throw error;
			}
		}
	}

	throw new ErrorDeSala(
		"error_interno",
		"No se pudo generar un código único para la sala. Intentá de nuevo.",
		500,
	);
}

/** Salas abiertas que el usuario puede ver: la suya (docente) o las de sus grupos (estudiante). */
export async function listarDisponibles(usuarioJwt) {
	const usuario = await cargarUsuario(usuarioJwt);

	if (usuario.rol === "docente") {
		const sala = registro.obtenerSalaDeDocente(usuario.id);
		return { salas: sala ? [aResumenDeSala(sala, usuario)] : [] };
	}

	const grupos = await grupoEstudianteRepository.findGruposByEstudiante(usuario.id);
	const salas = grupos
		.map((grupo) => registro.obtenerSalaDeGrupo(grupo.id))
		.filter(Boolean)
		.map((sala) => aResumenDeSala(sala, usuario));

	return { salas };
}

// --- Unirse, salir, estado ---

// Una sala que no está en memoria puede haber terminado: se lo informa solo a quien tiene relación con ella.
async function explicarSalaNoDisponible(usuario, fila) {
	if (!fila) {
		throw salaNoEncontrada();
	}

	const relacionada =
		usuario.rol === "docente"
			? fila.docente_id === usuario.id
			: Boolean(await grupoEstudianteRepository.findByGrupoYEstudiante(fila.grupo_id, usuario.id));

	if (relacionada && fila.estado === "finalizada") {
		throw new ErrorDeSala("sala_finalizada", "La actividad de esta sala ya finalizó.", 410);
	}

	if (relacionada && fila.estado === "cerrada") {
		throw new ErrorDeSala("sala_cerrada", "Esta sala fue cerrada.", 410);
	}

	throw salaNoEncontrada();
}

async function buscarSalaParaUnirse(usuario, datos) {
	if (datos.sala_id !== undefined) {
		const id = leerIdObligatorio(datos.sala_id, "sala_id");
		return (
			registro.obtenerSala(id) ?? (await explicarSalaNoDisponible(usuario, await salaRepository.findById(id)))
		);
	}

	if (typeof datos.codigo === "string") {
		const codigo = datos.codigo.trim().toUpperCase();

		if (!/^[A-Z0-9]{1,20}$/.test(codigo)) {
			throw salaNoEncontrada();
		}

		return (
			registro.obtenerSalaPorCodigo(codigo) ??
			(await explicarSalaNoDisponible(usuario, await salaRepository.findByCodigo(codigo)))
		);
	}

	throw new ErrorDeSala("payload_invalido", 'Indicá "sala_id" o "codigo" de la sala.', 400);
}

/**
 * Entrar a una sala por `sala_id` o `codigo`. El estudiante debe pertenecer al grupo de la sala y el
 * docente ser su dueño. Es idempotente y sirve también para reconectarse: devuelve el snapshot
 * actual (estado, instrucciones, participantes y últimos eventos).
 */
export async function unirseASala(usuarioJwt, socketId, payload) {
	const datos = exigirObjeto(payload);
	const usuario = await cargarUsuario(usuarioJwt);
	const sala = await buscarSalaParaUnirse(usuario, datos);

	if (usuario.rol === "docente") {
		if (sala.docenteId !== usuario.id) throw salaNoEncontrada();
	} else {
		const membresia = await grupoEstudianteRepository.findByGrupoYEstudiante(sala.grupo.id, usuario.id);
		if (!membresia) throw salaNoEncontrada();
	}

	// La membresía se consultó con await: la sala pudo cerrarse mientras tanto.
	asegurarAbierta(sala);

	const otraSala = registro.obtenerSalaDeUsuario(usuario.id);
	if (otraSala && otraSala !== sala) {
		throw new ErrorDeSala(
			"ya_en_otra_sala",
			"Ya estás en otra sala. Salí de ella antes de entrar a esta.",
			409,
			{
				sala_id: otraSala.id,
			},
		);
	}

	const actual = sala.participantes.get(usuario.id);
	if (
		usuario.rol === "estudiante" &&
		(!actual || actual.abandono) &&
		registro.contarEstudiantes(sala) >= MAX_PARTICIPANTES
	) {
		throw new ErrorDeSala("sala_llena", "La sala está llena.", 409);
	}

	// Igual que al crear: si el socket ya no existe (se cayó durante los `await`), no se lo agrega.
	if (!emisor.estaConectado(socketId)) {
		throw new ErrorDeSala("conexion_perdida", "Se perdió la conexión. Volvé a intentar.", 409);
	}

	const { participante, yaEstaba, reconexion, socketAnterior } = registro.agregarParticipante(
		sala,
		usuario,
		socketId,
	);

	if (socketAnterior) {
		// El mismo usuario entró desde otro socket (otra pestaña o una conexión caída): el nuevo toma su lugar.
		emisor.aSocket(socketAnterior, "sala:sesion_reemplazada", { sala_id: sala.id });
		emisor.sacarSocket(socketAnterior, sala.id);
	}

	emisor.unirSocket(socketId, sala.id);

	if (!yaEstaba) {
		emitirParticipantes(
			sala,
			reconexion ? "sala:participante_reconectado" : "sala:participante_conectado",
			{
				usuario_id: usuario.id,
				participante: {
					usuario_id: participante.usuarioId,
					nombre_usuario: participante.nombreUsuario,
					avatar: participante.avatar,
					rol: participante.rol,
					conectado: true,
					es_anfitrion: participante.esAnfitrion,
				},
			},
			{ excepto: socketId },
		);
	}

	return { ya_estaba: yaEstaba, sala: aSnapshot(sala, usuario) };
}

/**
 * El estudiante abandona su sala. Si la actividad está en curso queda constancia de que se fue
 * (participación `abandono`); el docente no "sale": cierra la sala con `cerrarSala`.
 */
export async function salirDeSala(usuarioJwt, payload) {
	exigirEstudiante(usuarioJwt);
	const datos = exigirObjeto(payload);

	const sala =
		datos.sala_id !== undefined
			? registro.obtenerSala(leerIdObligatorio(datos.sala_id, "sala_id"))
			: registro.obtenerSalaDeUsuario(usuarioJwt.id);

	// Salir de una sala que ya no existe (o de la que ya saliste) no es un error: el resultado es el mismo.
	const participante = sala?.participantes.get(usuarioJwt.id);
	if (!sala || !participante || participante.abandono) {
		return { sala_id: participante ? sala.id : null, salio: false };
	}

	if (sala.finalizacion) {
		throw new ErrorDeSala("operacion_en_curso", "La actividad se está finalizando. Intentá de nuevo.", 409);
	}

	const salida = registro.quitarParticipante(sala, usuarioJwt.id, {
		marcarAbandono: sala.estado === "en_curso",
	});

	if (salida?.socketId) emisor.sacarSocket(salida.socketId, sala.id);

	emitirParticipantes(sala, "sala:participante_salio", { usuario_id: usuarioJwt.id });

	return { sala_id: sala.id, salio: true };
}

/** Snapshot actual de la sala; si ya terminó, el resumen guardado en la base (solo dueño y participantes). */
export async function obtenerEstado(usuarioJwt, socketId, payload) {
	const datos = exigirObjeto(payload);
	const usuario = await cargarUsuario(usuarioJwt);

	const sala = localizarSala(socketId, datos);

	if (sala) {
		const participante = sala.participantes.get(usuario.id);
		const esDueno = usuario.rol === "docente" && sala.docenteId === usuario.id;

		if (!esDueno && (!participante || participante.abandono)) throw salaNoEncontrada();

		return { sala: aSnapshot(sala, usuario) };
	}

	if (datos.sala_id === undefined) {
		throw new ErrorDeSala("no_estas_en_sala", "No estás en ninguna sala. Indicá el sala_id.", 409);
	}

	const fila = await salaRepository.findById(leerIdObligatorio(datos.sala_id, "sala_id"));
	const esDueno = usuario.rol === "docente" && fila?.docente_id === usuario.id;
	const participacion =
		fila && !esDueno ? await participacionGrupalRepository.findBySalaYUsuario(fila.id, usuario.id) : null;

	if (!fila || (!esDueno && !participacion)) {
		throw salaNoEncontrada();
	}

	const participaciones = await participacionGrupalRepository.findBySala(fila.id);

	return {
		sala: {
			id: fila.id,
			...(esDueno ? { codigo: fila.codigo } : {}),
			estado: fila.estado,
			actividad_id: fila.actividad_id,
			grupo_id: fila.grupo_id,
			iniciada_en: aIso(fila.iniciada_en),
			finalizada_en: aIso(fila.finalizada_en),
			resultados: participaciones.map(aResultado),
		},
	};
}

function aResultado(participacion) {
	return {
		usuario_id: participacion.usuario_id,
		nombre_usuario: participacion.nombre_usuario,
		estado: participacion.estado,
		puntos_obtenidos: participacion.puntos_obtenidos,
		eventos_enviados: participacion.resultado?.eventos_enviados ?? 0,
	};
}

// --- Flujo de la actividad ---

/** El docente define el texto de instrucciones que verán todos antes de empezar (por defecto, la descripción de la actividad). */
export async function definirInstrucciones(usuarioJwt, socketId, payload) {
	const datos = exigirObjeto(payload);
	const sala = exigirSalaDelDocente(usuarioJwt, socketId, datos);
	asegurarAbierta(sala);

	if (sala.estado !== "esperando") {
		throw new ErrorDeSala(
			"estado_invalido",
			"Las instrucciones solo se pueden cambiar antes de iniciar.",
			409,
		);
	}

	if (datos.instrucciones !== null && typeof datos.instrucciones !== "string") {
		throw new ErrorDeSala("payload_invalido", 'El campo "instrucciones" debe ser texto.', 400);
	}

	const texto = typeof datos.instrucciones === "string" ? datos.instrucciones.trim() : "";

	if (texto.length > MAX_LONGITUD_INSTRUCCIONES) {
		throw new ErrorDeSala(
			"payload_invalido",
			`Las instrucciones no pueden superar los ${MAX_LONGITUD_INSTRUCCIONES} caracteres.`,
			400,
		);
	}

	sala.instrucciones = texto.length > 0 ? texto : (sala.actividad.descripcion ?? null);

	emisor.aSala(sala.id, "actividad:instrucciones", { sala_id: sala.id, instrucciones: sala.instrucciones });

	return { instrucciones: sala.instrucciones };
}

/** El docente inicia la actividad de forma sincronizada (hay un estudiante conectado como mínimo y la capacidad mínima). */
export async function iniciarActividad(usuarioJwt, socketId, payload) {
	const datos = exigirObjeto(payload);
	const sala = exigirSalaDelDocente(usuarioJwt, socketId, datos);
	asegurarAbierta(sala);

	if (sala.estado !== "esperando") {
		throw new ErrorDeSala("estado_invalido", "La actividad ya fue iniciada.", 409);
	}

	const conectados = registro.contarEstudiantes(sala, { soloConectados: true });
	const requeridos = Math.max(1, sala.capacidadMinima);

	if (conectados < requeridos) {
		throw new ErrorDeSala(
			"capacidad_minima_no_alcanzada",
			`Faltan participantes: hacen falta ${requeridos} conectados y hay ${conectados}.`,
			409,
			{ requeridos, conectados },
		);
	}

	await conBloqueo(sala, async () => {
		const ahora = new Date();

		if ((await salaRepository.marcarIniciada(sala.id, ahora)) === 0) {
			throw new ErrorDeSala("estado_invalido", "La actividad ya fue iniciada.", 409);
		}

		sala.estado = "en_curso";
		sala.iniciadaEn = ahora;
	});

	const aviso = {
		sala_id: sala.id,
		iniciada_en: aIso(sala.iniciadaEn),
		servidor_ahora: new Date().toISOString(),
		instrucciones: sala.instrucciones,
	};
	emisor.aSala(sala.id, "actividad:iniciada", aviso);

	return { iniciada_en: aviso.iniciada_en, servidor_ahora: aviso.servidor_ahora };
}

/** Acción de un participante durante la actividad: se numera, se guarda en el historial y se difunde a toda la sala. */
export async function enviarEvento(usuarioJwt, socketId, payload) {
	const datos = exigirObjeto(payload);
	const { sala, participante } = exigirParticipanteDelSocket(usuarioJwt, socketId, datos);
	asegurarAbierta(sala);

	if (sala.estado !== "en_curso") {
		throw new ErrorDeSala("actividad_no_iniciada", "La actividad no está en curso.", 409);
	}

	if (typeof datos.tipo !== "string" || !REGEX_TIPO_EVENTO.test(datos.tipo)) {
		throw new ErrorDeSala(
			"payload_invalido",
			'El campo "tipo" es obligatorio: minúsculas, números y guion bajo (hasta 40 caracteres).',
			400,
		);
	}

	const contenido = validarDatosLibres(datos.datos, "datos");

	sala.secuencia += 1;
	if (participante.rol === "estudiante") participante.eventosEnviados += 1;

	const evento = {
		sala_id: sala.id,
		secuencia: sala.secuencia,
		tipo: datos.tipo,
		datos: contenido,
		usuario_id: participante.usuarioId,
		nombre_usuario: participante.nombreUsuario,
		rol: participante.rol,
		timestamp: new Date().toISOString(),
	};

	registro.guardarEvento(sala, evento);
	emisor.aSala(sala.id, "actividad:evento", evento);

	return { secuencia: evento.secuencia };
}

/** El estudiante informa su resultado final; se guarda con su participación (el docente lo recibe al instante). */
export async function enviarResultado(usuarioJwt, socketId, payload) {
	exigirEstudiante(usuarioJwt);
	const datos = exigirObjeto(payload);
	const { sala, participante } = exigirParticipanteDelSocket(usuarioJwt, socketId, datos);
	asegurarAbierta(sala);

	if (sala.estado !== "en_curso") {
		throw new ErrorDeSala("actividad_no_iniciada", "La actividad no está en curso.", 409);
	}

	if (datos.resultado === undefined) {
		throw new ErrorDeSala("payload_invalido", 'El campo "resultado" es obligatorio.', 400);
	}

	participante.resultadoReportado = validarDatosLibres(datos.resultado, "resultado");

	const docente = sala.participantes.get(sala.docenteId);
	if (docente?.socketId) {
		emisor.aSocket(docente.socketId, "actividad:resultado_participante", {
			sala_id: sala.id,
			usuario_id: participante.usuarioId,
			nombre_usuario: participante.nombreUsuario,
			resultado: participante.resultadoReportado,
		});
	}

	return {};
}

/**
 * El docente da por terminada la actividad: registra la participación de cada estudiante, otorga los
 * puntos de la actividad (a través de `actividadService.completar`, que ya es idempotente por
 * usuario+actividad) y avisa a todos. Es idempotente: terminar dos veces devuelve el mismo resultado.
 */
export async function finalizarActividad(usuarioJwt, socketId, payload) {
	exigirDocente(usuarioJwt);
	const datos = exigirObjeto(payload);
	const sala = localizarSala(socketId, datos);

	// La sala ya no está en memoria: si es del docente y ya finalizó, el segundo "finalizar" es un éxito idempotente.
	if (!sala) {
		const fila =
			datos.sala_id !== undefined
				? await salaRepository.findById(leerIdObligatorio(datos.sala_id, "sala_id"))
				: null;

		if (!fila || fila.docente_id !== usuarioJwt.id) throw salaNoEncontrada();

		if (fila.estado !== "finalizada") {
			throw new ErrorDeSala("estado_invalido", "La actividad no está en curso.", 409);
		}

		const participaciones = await participacionGrupalRepository.findBySala(fila.id);
		return {
			ya_finalizada: true,
			finalizada_en: aIso(fila.finalizada_en),
			resultados: participaciones.map(aResultado),
		};
	}

	if (sala.docenteId !== usuarioJwt.id) throw salaNoEncontrada();

	if (sala.finalizacion) {
		return { ...(await sala.finalizacion), ya_finalizada: true };
	}

	if (sala.ocupada) {
		throw new ErrorDeSala(
			"operacion_en_curso",
			"Hay otra operación en curso en la sala. Intentá de nuevo.",
			409,
		);
	}

	if (sala.estado !== "en_curso") {
		throw new ErrorDeSala("estado_invalido", "La actividad no está en curso.", 409);
	}

	const finalizacion = ejecutarFinalizacion(sala);
	sala.finalizacion = finalizacion;

	try {
		return { ...(await finalizacion), ya_finalizada: false };
	} catch (error) {
		// Si falló antes de confirmar (la transacción se revirtió), la sala sigue en curso y se puede reintentar.
		if (sala.finalizacion === finalizacion) sala.finalizacion = null;
		throw error;
	}
}

async function ejecutarFinalizacion(sala) {
	const ahora = new Date();
	const duracionSegundos = Math.max(0, Math.round((ahora.getTime() - sala.iniciadaEn.getTime()) / 1000));

	const estudiantes = [...sala.participantes.values()].filter(
		(participante) => participante.rol === "estudiante",
	);
	const filas = estudiantes.map((participante) => ({
		usuarioId: participante.usuarioId,
		estado: participante.abandono ? "abandono" : "completo",
		resultado: {
			eventos_enviados: participante.eventosEnviados,
			resultado_reportado: participante.resultadoReportado,
			duracion_segundos: duracionSegundos,
		},
	}));

	const confirmada = await salaRepository.finalizarConParticipaciones(sala.id, ahora, filas);

	if (!confirmada) {
		// Puede que una finalización anterior sí se haya confirmado (por ejemplo, se perdió su respuesta):
		// si la base ya la da por finalizada se limpia la sala y se devuelve lo guardado.
		const fila = await salaRepository.findById(sala.id);

		if (fila?.estado !== "finalizada") {
			throw new ErrorDeSala("estado_invalido", "La actividad no está en curso.", 409);
		}

		const participaciones = await participacionGrupalRepository.findBySala(sala.id);
		emisor.vaciarSala(sala.id);
		registro.eliminarSala(sala.id);
		return { finalizada_en: aIso(fila.finalizada_en), resultados: participaciones.map(aResultado) };
	}

	// Desde acá la finalización ya es definitiva: pase lo que pase, la sala se libera al terminar.
	// Los resultados se arman con la foto de arriba (lo que se guardó), no con el estado vivo, que
	// puede cambiar mientras se otorgan los puntos.
	sala.estado = "finalizada";

	try {
		const puntosPorUsuario = await otorgarPuntos(sala, filas);

		const resultados = estudiantes.map((participante, indice) => ({
			usuario_id: participante.usuarioId,
			nombre_usuario: participante.nombreUsuario,
			estado: filas[indice].estado,
			puntos_obtenidos: puntosPorUsuario.get(participante.usuarioId)?.puntos ?? 0,
			eventos_enviados: filas[indice].resultado.eventos_enviados,
		}));

		for (const participante of estudiantes) {
			const premio = puntosPorUsuario.get(participante.usuarioId);

			if (participante.socketId && premio?.detalle) {
				emisor.aSocket(participante.socketId, "actividad:recompensa", {
					sala_id: sala.id,
					...premio.detalle,
				});
			}
		}

		const finalizadaEn = aIso(ahora);
		emisor.aSala(sala.id, "actividad:finalizada", {
			sala_id: sala.id,
			finalizada_en: finalizadaEn,
			resultados,
		});

		return { finalizada_en: finalizadaEn, resultados };
	} finally {
		emisor.vaciarSala(sala.id);
		registro.eliminarSala(sala.id);
	}
}

// Puntos de la actividad para quien la completó. `actividadService.completar` suma una sola vez por
// usuario+actividad (UNIQUE), así que repetir la actividad en otra sala no vuelve a dar puntos.
async function otorgarPuntos(sala, filas) {
	const puntosPorUsuario = new Map();
	const completos = filas.filter((fila) => fila.estado === "completo");

	const TAMANO_LOTE = 5;
	for (let i = 0; i < completos.length; i += TAMANO_LOTE) {
		await Promise.all(
			completos.slice(i, i + TAMANO_LOTE).map(async (fila) => {
				try {
					const completada = await actividadService.completar(sala.actividad.id, fila.usuarioId);

					puntosPorUsuario.set(fila.usuarioId, {
						puntos: completada.puntos_obtenidos,
						detalle: {
							puntos_obtenidos: completada.puntos_obtenidos,
							progreso: completada.progreso,
							retroalimentacion: completada.retroalimentacion,
							positive_message: completada.positive_message,
						},
					});

					if (completada.puntos_obtenidos > 0) {
						await participacionGrupalRepository.actualizarPuntos(
							sala.id,
							fila.usuarioId,
							completada.puntos_obtenidos,
						);
					}
				} catch (error) {
					// Un fallo al premiar a un estudiante no debe impedir terminar la actividad de los demás.
					registrarError(`otorgar los puntos de la sala ${sala.id}`, error);
				}
			}),
		);
	}

	return puntosPorUsuario;
}

// --- Cerrar ---

/** El docente cancela la sala (en espera o en curso): nadie recibe puntos y no se registra participación. */
export async function cerrarSala(usuarioJwt, socketId, payload) {
	exigirDocente(usuarioJwt);
	const datos = exigirObjeto(payload);
	const sala = localizarSala(socketId, datos);

	if (!sala) {
		const fila =
			datos.sala_id !== undefined
				? await salaRepository.findById(leerIdObligatorio(datos.sala_id, "sala_id"))
				: null;

		if (!fila || fila.docente_id !== usuarioJwt.id) throw salaNoEncontrada();

		// Una sala abierta en la base que ya no está en memoria quedó huérfana: se la cierra igual.
		const cerradaAhora = (await salaRepository.cerrar(fila.id)) > 0;
		return { estado: cerradaAhora ? "cerrada" : fila.estado, ya_cerrada: !cerradaAhora };
	}

	if (sala.docenteId !== usuarioJwt.id) throw salaNoEncontrada();

	if (sala.finalizacion) {
		throw new ErrorDeSala("operacion_en_curso", "La actividad se está finalizando. Intentá de nuevo.", 409);
	}

	await conBloqueo(sala, () => salaRepository.cerrar(sala.id));

	difundirCierre(sala, "docente");

	return { estado: "cerrada", ya_cerrada: false };
}

// --- Desconexión controlada, mantenimiento y arranque ---

/**
 * Un socket se cayó. Si estaba en una sala, el participante queda "desconectado" durante un período de gracia:
 * se avisa a los demás y, si no vuelve a tiempo, se lo da por salido (o, si era el docente, se cierra la sala).
 */
export function manejarDesconexion(socketId) {
	const resultado = registro.marcarDesconectado(socketId);
	if (!resultado) return;

	const { sala, participante } = resultado;
	const graciaMs = registro.programarExpiracion(sala, participante, alExpirarGracia);

	emitirParticipantes(sala, "sala:participante_desconectado", {
		usuario_id: participante.usuarioId,
		rol: participante.rol,
		gracia_ms: graciaMs,
	});
}

function alExpirarGracia(sala, participante) {
	if (participante.rol === "docente") {
		// Con otra operación en curso (iniciar, finalizar) se vuelve a esperar: si esa operación falla, la
		// sala no puede quedar abierta sin docente.
		if (sala.ocupada || sala.finalizacion) {
			registro.programarExpiracion(sala, participante, alExpirarGracia);
		} else {
			cerrarPorSistema(sala, "docente_ausente").catch(registrarFalloDeCierre);
		}
		return;
	}

	registro.quitarParticipante(sala, participante.usuarioId, { marcarAbandono: sala.estado === "en_curso" });
	emitirParticipantes(sala, "sala:participante_expirado", { usuario_id: participante.usuarioId });
}

function registrarFalloDeCierre(error) {
	registrarError("sockets al cerrar una sala", error);
}

// Cierre iniciado por el servidor (docente ausente o sala vencida): sin puntos ni participación.
async function cerrarPorSistema(sala, motivo) {
	if (sala.ocupada || sala.finalizacion || registro.obtenerSala(sala.id) !== sala) return;

	sala.ocupada = true;
	try {
		await salaRepository.cerrar(sala.id);
	} catch (error) {
		registrarError(`cerrar la sala ${sala.id} en la base de datos`, error);
	}

	try {
		difundirCierre(sala, motivo);
	} finally {
		sala.ocupada = false;
	}
}

/** Cierra las salas que llevan abiertas demasiado tiempo (se llama periódicamente). */
export function cerrarSalasVencidas() {
	const limite = Date.now() - MAX_VIDA_SALA_MS;

	for (const sala of registro.listarSalas()) {
		if (sala.creadaEn < limite) cerrarPorSistema(sala, "tiempo_agotado").catch(registrarFalloDeCierre);
	}
}

/** Las salas viven en memoria: al arrancar, las que figuran abiertas en la base son de una ejecución anterior. */
export async function cerrarSalasHuerfanas() {
	const cerradas = await salaRepository.cerrarAbiertas();

	if (cerradas > 0) {
		console.log(`Salas huérfanas cerradas al arrancar: ${cerradas}`);
	}
}
