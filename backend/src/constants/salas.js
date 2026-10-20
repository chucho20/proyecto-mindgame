// Límites y tiempos de las salas de actividades grupales en tiempo real.

// Estudiantes por sala (un curso típico). Se cuentan también los que están en período de gracia.
export const MAX_PARTICIPANTES = 40;

// Tiempo que se espera a un participante desconectado antes de darlo por salido (RF-019: desconexión
// controlada). Se puede ajustar por entorno (útil para pruebas); el docente tiene más margen porque
// sin él la sala no puede avanzar.
export const GRACIA_ESTUDIANTE_MS = Number(process.env.SALA_GRACIA_ESTUDIANTE_MS) || 30_000;
export const GRACIA_DOCENTE_MS = Number(process.env.SALA_GRACIA_DOCENTE_MS) || 60_000;

// Una sala abierta más tiempo que esto se cierra sola (evita salas olvidadas en memoria).
export const MAX_VIDA_SALA_MS = 4 * 60 * 60 * 1000;
export const INTERVALO_MANTENIMIENTO_MS = 5 * 60 * 1000;

// Texto de instrucciones, tipo de evento y tamaño del payload JSON de un evento/resultado.
export const MAX_LONGITUD_INSTRUCCIONES = 2000;
export const MAX_BYTES_DATOS = 2048;
export const REGEX_TIPO_EVENTO = /^[a-z0-9_]{1,40}$/;

// Últimos eventos que se guardan en memoria para el snapshot de quien llega tarde o se reconecta.
export const MAX_EVENTOS_RECIENTES = 100;

// Límite de ritmo por socket: máximo de eventos por ventana, y de sockets simultáneos por usuario.
export const LIMITE_EVENTOS_POR_VENTANA = 40;
export const VENTANA_EVENTOS_MS = 10_000;
export const MAX_SOCKETS_POR_USUARIO = 5;

// Código corto de sala: mismo alfabeto que el de grupos (sin 0/O ni 1/I/L).
export const ALFABETO_CODIGO_SALA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LONGITUD_CODIGO_SALA = 6;
export const MAXIMO_INTENTOS_CODIGO_SALA = 5;
