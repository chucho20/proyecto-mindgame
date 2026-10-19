/**
 * Indica si un error de base de datos es una violación de restricción UNIQUE.
 *
 * Los repositorios hablan Prisma, que reporta el duplicado como `P2002`
 * (PrismaClientKnownRequestError). Se mantiene también `ER_DUP_ENTRY` (código
 * nativo de mysql2/MySQL) para que los servicios sigan funcionando si algún
 * camino todavía lanza el error del driver original.
 */
export function esViolacionUnica(error) {
	return Boolean(error) && (error.code === "ER_DUP_ENTRY" || error.code === "P2002");
}
