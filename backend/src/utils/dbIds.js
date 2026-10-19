// Máximo valor de una columna INT (con signo) en MySQL.
const MAX_INT = 2147483647;

/**
 * Normaliza un id que puede llegar como string (Express entrega
 * `req.params.id` como texto) a un entero positivo válido para Prisma.
 *
 * Devuelve `null` si el valor no representa un id posible. Los repositorios
 * lo usan en las lecturas para responder "no existe" (null / lista vacía / 0)
 * igual que lo hacía MySQL con `WHERE id = 'abc'`, en vez de dejar que Prisma
 * lance un error de validación y termine en un 500.
 */
export function normalizarId(valor) {
	const numero = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
	return Number.isInteger(numero) && numero > 0 && numero <= MAX_INT ? numero : null;
}
