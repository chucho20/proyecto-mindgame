import { Router } from "express";

import * as teacherController from "../controllers/teacher.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

const router = Router();

// Todo lo que cuelga de /api/docente exige rol docente (RF-021). Se aplica con
// router.use porque el router se monta bajo ese prefijo y no intercepta otros.
router.use(authMiddleware, requireRole("docente"));

router.post("/grupos", teacherController.crearGrupo);
router.get("/grupos", teacherController.listarGrupos);
router.get("/grupos/:id", teacherController.obtenerGrupo);
router.get("/grupos/:id/estudiantes", teacherController.listarEstudiantes);
router.delete("/grupos/:id/estudiantes/:estudianteId", teacherController.retirarEstudiante);
router.get("/grupos/:id/estadisticas", teacherController.estadisticasDelGrupo);

router.get("/estudiantes/:id/estadisticas", teacherController.estadisticasDelEstudiante);

// Actividades activas para elegir la de una sala en vivo (RF-019).
router.get("/actividades", teacherController.listarActividades);

export default router;
