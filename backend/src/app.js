import express from "express";
import cors from "cors";

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

export default app;
