import { Router } from "express";
import { obtenerProgreso } from "../controllers/progress.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", obtenerProgreso);

export default router;