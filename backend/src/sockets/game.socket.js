/**
 * Punto de entrada del servidor Socket.io (SDD sección 6). Por ahora solo
 * registra conexión/desconexión — el manejo de salas y eventos de actividades
 * grupales en tiempo real (RF-019) se agrega en Sprint 4, junto con las
 * variables globales/estáticas necesarias.
 */
export default function registerGameSocket(io) {
	io.on("connection", (socket) => {
		console.log("Usuario conectado:", socket.id);

		socket.on("disconnect", () => {
			console.log("Usuario desconectado:", socket.id);
		});
	});
}
