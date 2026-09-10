import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import adminRoutes from "./routes/admin.routes.js";

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
app.use("/api/admin", adminRoutes);

export default app;
