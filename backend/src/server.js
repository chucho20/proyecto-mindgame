import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	console.log("Usuario conectado:", socket.id);

	socket.on("disconnect", () => {
		console.log("Usuario desconectado:", socket.id);
	});
});

server.listen(PORT, () => {
	console.log(`🎮 MindGame API ejecutándose en puerto ${PORT}`);
});
