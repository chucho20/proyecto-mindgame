// Categorías válidas de una misión (enum CategoriaMision del schema de Prisma).
export const CATEGORIA_HISTORICA = "historica";
export const CATEGORIA_CONVIVENCIA = "convivencia";
export const CATEGORIAS_MISION = [CATEGORIA_HISTORICA, CATEGORIA_CONVIVENCIA];

// Contextos de los mensajes positivos (columna `mensajes_positivos.contexto`).
// El admin debe cargar los mensajes con exactamente estos textos de contexto.
export const CONTEXTO_RETO_COMPLETADO = "reto_completado";
export const CONTEXTO_ACTIVIDAD_COMPLETADA = "actividad_completada";
export const CONTEXTOS_CONOCIDOS = [CONTEXTO_RETO_COMPLETADO, CONTEXTO_ACTIVIDAD_COMPLETADA];
