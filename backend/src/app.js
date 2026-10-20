import express from "express";
import cors from "cors";

import env from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import grupoRoutes from "./routes/grupo.routes.js";
import { manejadorDeErrores, rutaNoEncontrada } from "./middlewares/error.middleware.js";
import {
	limitarLoginPorIp,
	limitarRecuperacion,
	limitarRegistro,
	limitarRestablecimiento,
} from "./middlewares/rateLimit.middleware.js";
import {
	cabecerasDeSeguridad,
	exigirHttps,
	opcionesCors,
	rechazarOrigenNoPermitido,
	sinCache,
} from "./middlewares/security.middleware.js";

// Routers montados y su prefijo. Lo usa también scripts/listar-rutas.js para auditar qué protege cada ruta.
export const MONTAJES = [
	["/api/auth", authRoutes],
	["/api/profile", profileRoutes],
	["/api", missionRoutes],
	["/api", progressRoutes],
	["/api/admin", adminRoutes],
	["/api/docente", teacherRoutes],
	["/api/grupos", grupoRoutes],
];

const app = express();

app.disable("x-powered-by");

// Detrás de un proxy que termina TLS (Render, Railway, nginx...): ver TRUST_PROXY en la configuración.
// Sin esto `req.ip` sería la del proxy y los límites de intentos tratarían a todos como un solo cliente.
if (env.trustProxy !== false) {
	app.set("trust proxy", env.trustProxy);
}

// Orden deliberado: transporte seguro -> cabeceras -> origen -> CORS -> límites por IP -> cuerpo -> rutas.
app.use(exigirHttps);
app.use(cabecerasDeSeguridad);
app.use("/api", sinCache);
app.use(rechazarOrigenNoPermitido);
app.use(cors(opcionesCors));

// Los límites por IP corren ANTES de leer el cuerpo: una IP bloqueada no obliga al servidor a procesarlo.
app.post("/api/auth/login", limitarLoginPorIp);
app.post("/api/auth/register", limitarRegistro);
app.post("/api/auth/forgot-password", limitarRecuperacion);
app.post("/api/auth/reset-password", limitarRestablecimiento);

app.use(express.json({ limit: env.jsonBodyLimit }));

app.get("/api/health", (req, res) => {
	res.json({
		ok: true,
		message: "MindGame API funcionando",
	});
});

for (const [prefijo, router] of MONTAJES) {
	app.use(prefijo, router);
}

app.use(rutaNoEncontrada);
app.use(manejadorDeErrores);

export default app;
