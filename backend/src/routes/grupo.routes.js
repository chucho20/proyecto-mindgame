import { Router } from "express";

import * as grupoController from "../controllers/grupo.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

// Grupos del estudiante: todo lo que cuelga de /api/grupos exige rol estudiante.
router.use(authMiddleware, requireRole("estudiante"));

router.post("/unirse", grupoController.unirse);
router.get("/mios", grupoController.listarMios);
router.delete("/mios/:id", grupoController.salir);

export default router;
