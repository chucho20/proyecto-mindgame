import {
	obtenerSala,
	marcarDesconectado,
	reasignarAnfitrion,
	programarExpiracion,
	obtenerContextoPorSocket,
} from "./salas.manager.js";

export default function registerGameSocket(io) {
	io.on("connection", (socket) => {
		console.log("Usuario conectado:", socket.id);

		/*
		 * La autenticación y la asociación del usuario con una sala
		 * deben realizarse mediante los eventos de ingreso de tu aplicación.
		 */

		socket.on("disconnect", () => {
			console.log("Usuario desconectado:", socket.id);

			const contexto = obtenerContextoPorSocket(socket.id);
			if (!contexto) return;

			const { salaId, usuarioId } = contexto;
			const resultado = marcarDesconectado(salaId, socket.id);

			if (!resultado) return;

			const { sala, participante } = resultado;

			io.to(salaId).emit("sala:participante-desconectado", { usuarioId });

			const anfitrionAnterior = participante.esAnfitrion;
			const anfitrion = reasignarAnfitrion(sala);

			if (anfitrionAnterior && anfitrion && anfitrion.usuarioId !== usuarioId) {
				io.to(salaId).emit("sala:anfitrion-cambiado", {
					usuarioId: anfitrion.usuarioId,
				});
			}

			programarExpiracion(
				salaId,
				usuarioId,
				({ sala: salaActual, usuarioId: expulsado, anfitrion: nuevoAnfitrion }) => {
					io.to(salaId).emit("sala:participante-expirado", {
						usuarioId: expulsado,
					});

					if (nuevoAnfitrion) {
						io.to(salaId).emit("sala:anfitrion-cambiado", {
							usuarioId: nuevoAnfitrion.usuarioId,
						});
					}

					if (salaActual.participantes.length === 0) {
						io.to(salaId).emit("sala:vacia");
					}
				},
			);
		});
	});
}
