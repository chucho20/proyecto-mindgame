import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import grupoRoutes from "./routes/grupo.routes.js";

const app = express();

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	}),
);

app.use(express.json());

app.get("/api/health", (req, res) => {
	res.json({
		ok: true,
		message: "MindGame API funcionando",
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", missionRoutes);
app.use("/api", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/docente", teacherRoutes);
app.use("/api/grupos", grupoRoutes);

export default app;
