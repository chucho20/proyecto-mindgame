import {
	obtenerEstadisticasGrupo,
	obtenerEstadisticasEstudianteDocente,
} from "../controllers/teacher.controller.js";

// Integra estas rutas en el router docente existente.
// authMiddleware y requireDocente representan los middlewares
// de autenticación y autorización que ya tenga tu aplicación.

router.get("/grupos/:id/estadisticas", authMiddleware, requireDocente, obtenerEstadisticasGrupo);

router.get(
	"/estudiantes/:id/estadisticas",
	authMiddleware,
	requireDocente,
	obtenerEstadisticasEstudianteDocente,
);
