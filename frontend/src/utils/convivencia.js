/**
 * Contextos de los mensajes positivos que el backend sabe mostrar (la API los
 * devuelve como `contextos_conocidos`; esta lista es el respaldo si no llegan) y
 * su etiqueta para el admin. Es la única fuente de estos textos en el frontend.
 */
export const CONTEXTO_LABELS = {
	reto_completado: "Reto completado",
	actividad_completada: "Actividad completada",
};

export const CONTEXTOS_POR_DEFECTO = Object.keys(CONTEXTO_LABELS);

/** Etiqueta legible de un contexto; si no es conocido devuelve el valor tal cual. */
export function etiquetaContexto(contexto) {
	return CONTEXTO_LABELS[contexto] || contexto;
}
