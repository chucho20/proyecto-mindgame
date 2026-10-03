import { Router } from "express";

import * as adminController from "../controllers/admin.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import requireRole from "../middlewares/role.middleware.js";

const router = Router();

// Todo lo que cuelga de /api/admin exige rol administrador (RF-024/025).

router.use(authMiddleware, requireRole("administrador"));

// --- Stats ---

router.get("/stats", adminController.obtenerStats);

// --- Misiones ---

router.get("/misiones", adminController.listarMisiones);

router.get("/misiones/:id", adminController.obtenerMision);

router.post("/misiones", adminController.crearMision);

router.put("/misiones/:id", adminController.actualizarMision);

router.put("/misiones/:id/estado", adminController.cambiarEstadoMision);

router.delete("/misiones/:id", adminController.eliminarMision);

// --- Historias ---

router.get("/historias", adminController.listarHistorias);

router.get("/historias/:id", adminController.obtenerHistoria);

router.post("/historias", adminController.crearHistoria);

router.put("/historias/:id", adminController.actualizarHistoria);

router.put("/historias/:id/estado", adminController.cambiarEstadoHistoria);

router.delete("/historias/:id", adminController.eliminarHistoria);

// --- Retos ---

router.get("/retos", adminController.listarRetos);

router.get("/retos/:id", adminController.obtenerReto);

router.post("/retos", adminController.crearReto);

router.put("/retos/:id", adminController.actualizarReto);

router.put("/retos/:id/estado", adminController.cambiarEstadoReto);

router.delete("/retos/:id", adminController.eliminarReto);

// --- Actividades ---

router.get("/actividades", adminController.listarActividades);

router.get("/actividades/:id", adminController.obtenerActividad);

router.post("/actividades", adminController.crearActividad);

router.put("/actividades/:id", adminController.actualizarActividad);

router.put("/actividades/:id/estado", adminController.cambiarEstadoActividad);

router.delete("/actividades/:id", adminController.eliminarActividad);

// --- Recompensas ---

router.get("/recompensas", adminController.listarRecompensas);

router.post("/recompensas", adminController.crearRecompensa);

router.put("/recompensas/:id", adminController.actualizarRecompensa);

router.patch(
	"/recompensas/:id/estado",
	adminController.cambiarEstadoRecompensa,
);

// --- Logros ---

router.get("/logros", adminController.listarLogros);

router.post("/logros", adminController.crearLogro);

router.put("/logros/:id", adminController.actualizarLogro);

router.patch(
	"/logros/:id/estado",
	adminController.cambiarEstadoLogro,
);

// --- Mensajes positivos ---

router.get(
	"/mensajes-positivos",
	adminController.listarMensajesPositivos,
);

router.post(
	"/mensajes-positivos",
	adminController.crearMensajePositivo,
);

router.put(
	"/mensajes-positivos/:id",
	adminController.actualizarMensajePositivo,
);

router.patch(
	"/mensajes-positivos/:id/estado",
	adminController.cambiarEstadoMensajePositivo,
);

export default router;