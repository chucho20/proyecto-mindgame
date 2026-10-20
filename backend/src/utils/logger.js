// Los mensajes de error de Prisma/mysql2 pueden incluir los valores de la consulta (hashes de contraseña,
// correos) y un error de red puede traer cabeceras: antes de escribir en el log se tapan los secretos conocidos.
const PATRONES_SECRETOS = [
	[/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g, "[jwt]"],
	[/\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}/g, "[hash]"],
	[/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [token]"],
	[/\b[a-f0-9]{64}\b/gi, "[token]"],
	[
		/(password|passwordHash|password_hash|token|tokenHash|authorization|secret)(["']?\s*[:=]\s*)(["'])?[^\s,"'}]+/gi,
		"$1$2[oculto]",
	],
];

export function redactar(texto) {
	return PATRONES_SECRETOS.reduce(
		(acumulado, [patron, reemplazo]) => acumulado.replace(patron, reemplazo),
		String(texto),
	);
}

/**
 * Registra un error inesperado sin filtrar secretos. En producción solo escribe el nombre, el código y el
 * mensaje; fuera de producción agrega la traza para depurar.
 */
export function registrarError(contexto, error) {
	const nombre = error?.name ?? "Error";
	const codigo = error?.code ? ` [${error.code}]` : "";
	const mensaje = redactar(error?.message ?? error);
	const traza = process.env.NODE_ENV === "production" || !error?.stack ? "" : `\n${redactar(error.stack)}`;

	console.error(`Error inesperado en ${contexto}: ${nombre}${codigo}: ${mensaje}${traza}`);
}
