import helmet from "helmet";

import env from "../config/env.js";

/**
 * Cabeceras y controles de transporte de la API (RNF-003 / RNF-004).
 */

// --- Origen permitido (CORS de HTTP y de Socket.io comparten esta lista: env.corsOrigins) ---

/**
 * Un pedido sin cabecera `Origin` (curl, apps móviles, servidor a servidor) no es una llamada desde un
 * navegador, así que CORS no aplica: se permite y la autenticación decide. Si trae `Origin`, debe estar
 * en la lista exacta.
 */
export function origenPermitido(origen) {
	return origen === undefined || env.corsOrigins.includes(origen);
}

export const opcionesCors = {
	origin(origen, callback) {
		callback(null, origenPermitido(origen) ? origen : false);
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	// El navegador puede guardar el resultado del preflight 10 minutos.
	maxAge: 600,
};

/** Rechaza (403) las peticiones de navegador desde un origen que no está en la lista. */
export function rechazarOrigenNoPermitido(req, res, next) {
	if (!origenPermitido(req.headers.origin)) {
		return res.status(403).json({ message: "Origen no permitido." });
	}

	return next();
}

// --- HTTPS ---

/**
 * ¿La petición llegó por TLS? Con `TRUST_PROXY` configurado, Express interpreta `X-Forwarded-Proto` del
 * proxy de confianza (`req.secure`). Para la subida de Socket.io (un `IncomingMessage` sin Express) se
 * aplica la misma regla.
 */
export function esConexionSegura(req) {
	if (typeof req.secure === "boolean") {
		return req.secure;
	}

	if (req.socket?.encrypted) {
		return true;
	}

	if (env.trustProxy === false) {
		return false;
	}

	// Se toma el ÚLTIMO valor: es el que agregó el proxy más cercano; los anteriores pueden venir del cliente.
	const protocolo = String(req.headers?.["x-forwarded-proto"] ?? "")
		.split(",")
		.pop()
		.trim()
		.toLowerCase();
	return protocolo === "https" || protocolo === "wss";
}

/**
 * Con `FORCE_HTTPS=true` rechaza lo que no llegó por HTTPS. Excepción: `/api/health`, porque los chequeos
 * de salud de las plataformas suelen entrar por HTTP interno.
 */
export function exigirHttps(req, res, next) {
	if (
		!env.forceHttps ||
		esConexionSegura(req) ||
		req.path.toLowerCase().replace(/\/+$/, "") === "/api/health"
	) {
		return next();
	}

	return res.status(403).json({ message: "Esta API solo acepta conexiones seguras (HTTPS)." });
}

// --- Cabeceras de seguridad (helmet) ---

// API JSON sin HTML: la CSP más restrictiva posible. HSTS solo en producción (en desarrollo se sirve por HTTP).
export const cabecerasDeSeguridad = helmet({
	contentSecurityPolicy: {
		useDefaults: false,
		directives: {
			defaultSrc: ["'none'"],
			frameAncestors: ["'none'"],
			baseUri: ["'none'"],
			formAction: ["'none'"],
		},
	},
	hsts: env.isProduction ? { maxAge: 15552000 } : false,
	referrerPolicy: { policy: "no-referrer" },
	// El frontend vive en otro origen y consume la API con fetch/XHR: lo que decide quién puede leer las
	// respuestas es CORS (lista de orígenes), no esta política.
	crossOriginResourcePolicy: { policy: "cross-origin" },
});

/** Las respuestas de la API llevan datos personales y tokens: ningún navegador ni proxy debe guardarlas. */
export function sinCache(_req, res, next) {
	res.set("Cache-Control", "no-store");
	return next();
}
