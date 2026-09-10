import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import env from "./config/env.js";
import app from "./app.js";
import registerGameSocket from "./sockets/game.socket.js";

const PORT = env.port;

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

registerGameSocket(io);

server.listen(PORT, () => {
	console.log(`🎮 MindGame API ejecutándose en puerto ${PORT}`);
});
