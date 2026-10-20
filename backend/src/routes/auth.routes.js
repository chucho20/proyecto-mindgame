import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { limitarLoginPorCuenta, limitarRecuperacionPorCuenta } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Rutas públicas (no llevan token): sus límites de intentos por IP se aplican en app.js, antes de leer el
// cuerpo; el límite por cuenta del login necesita el cuerpo, por eso va acá.
router.post("/register", authController.register);
router.post("/login", limitarLoginPorCuenta, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", limitarRecuperacionPorCuenta, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
