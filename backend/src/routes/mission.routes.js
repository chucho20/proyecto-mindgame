import { Router } from "express";

import * as missionController from "../controllers/mission.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

// Cualquier rol autenticado puede explorar/leer contenido (RF-007 a RF-011).
router.use(authMiddleware);

router.get("/misiones", missionController.listarMisiones);
router.get("/misiones/:id", missionController.obtenerMision);
router.post("/misiones/:id/iniciar", requireRole("estudiante"), missionController.iniciarMision);

router.get("/misiones/:id/historias", missionController.listarHistorias);
router.post("/historias/:id/completar", requireRole("estudiante"), missionController.completarHistoria);

router.get("/misiones/:id/retos", missionController.listarRetos);
router.post("/retos/:id/responder", requireRole("estudiante"), missionController.responderReto);

router.get("/misiones/:id/actividades", missionController.listarActividades);
router.post("/actividades/:id/completar", requireRole("estudiante"), missionController.completarActividad);

export default router;
