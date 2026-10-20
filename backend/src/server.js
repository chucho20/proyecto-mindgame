import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import env from "./config/env.js";
import app from "./app.js";
import { esConexionSegura, origenPermitido } from "./middlewares/security.middleware.js";
import registerGameSocket from "./sockets/game.socket.js";

const PORT = env.port;

const server = http.createServer(app);

const io = new Server(server, {
	// No se sirve el cliente de Socket.io desde el backend (el frontend lo trae como dependencia).
	serveClient: false,
	cors: {
		origin: env.corsOrigins,
		methods: ["GET", "POST"],
		credentials: true,
	},
	// CORS solo cubre el sondeo HTTP (long-polling): el navegador NO aplica CORS a WebSocket, así que el
	// origen y el transporte seguro se validan acá, en cada apretón de manos y subida de protocolo.
	allowRequest(req, callback) {
		if (!origenPermitido(req.headers.origin)) {
			return callback("Origen no permitido.", false);
		}

		if (env.forceHttps && !esConexionSegura(req)) {
			return callback("Se requiere una conexión segura (WSS).", false);
		}

		return callback(null, true);
	},
	// Un handshake que no termina en 10 s se descarta (por defecto 45 s) para no retener conexiones a medias.
	connectTimeout: 10_000,
	// Tope del tamaño de un mensaje (por defecto 1 MB): los eventos de las actividades son pequeños.
	maxHttpBufferSize: 20 * 1024,
});

await registerGameSocket(io);

server.listen(PORT, () => {
	console.log(`🎮 MindGame API ejecutándose en puerto ${PORT}`);
});
