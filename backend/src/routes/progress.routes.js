import { Router } from "express";

import * as progressController from "../controllers/progress.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

// Progresión del estudiante (RF-014 a RF-017, RF-020). Los middlewares se
// aplican ruta por ruta (no con router.use) porque este router cuelga de
// /api, igual que el de misiones, y no debe interceptar /api/admin/*.
const soloEstudiante = [authMiddleware, requireRole("estudiante")];

router.get("/progreso", ...soloEstudiante, progressController.obtenerProgreso);
router.get("/recompensas", ...soloEstudiante, progressController.listarRecompensas);
router.get("/logros", ...soloEstudiante, progressController.listarLogros);

export default router;
