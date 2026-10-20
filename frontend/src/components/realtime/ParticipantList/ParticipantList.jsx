import { avatarEmoji } from "../../../constants/avatars.js";
import { useAhora } from "../../../hooks/useAhora.js";
import { segundosRestantes } from "../../../utils/salaTiempoReal.js";
import "../realtime.css";
import "./ParticipantList.css";

/**
 * Participantes de la sala con su estado de conexión (RF-019): conectado, o desconectado con los segundos
 * que le quedan para volver antes de que el servidor lo dé por salido. `terminaron` (opcional, vista del
 * docente) marca a los estudiantes que ya informaron su resultado. La cuenta regresiva está fuera del
 * texto accesible: los cambios de presencia se anuncian aparte, una sola vez.
 */
function ParticipantList({
	participantes,
	graciaPorUsuario = {},
	usuarioId,
	terminaron,
	titulo = "Participantes",
}) {
	const hayDesconectados = participantes.some((participante) => !participante.conectado);
	const ahora = useAhora(hayDesconectados);
	const conectados = participantes.filter((participante) => participante.conectado).length;

	return (
		<section className="participant-list" aria-labelledby="participant-list-titulo">
			<h2 id="participant-list-titulo" className="rt-card__title">
				{titulo}{" "}
				<span className="participant-list__count">
					({conectados} {conectados === 1 ? "conectado" : "conectados"} de {participantes.length})
				</span>
			</h2>

			{participantes.length === 0 ? (
				<p className="rt-hint">Todavía no hay nadie en la sala.</p>
			) : (
				<ul className="participant-list__items">
					{participantes.map((participante) => {
						const gracia = graciaPorUsuario[participante.usuario_id];
						const restantes = gracia ? segundosRestantes(gracia.desde, gracia.graciaMs, ahora) : null;
						const esUno = participante.usuario_id === usuarioId;
						const termino = terminaron?.has(participante.usuario_id) ?? false;

						return (
							<li
								key={participante.usuario_id}
								className={
									participante.conectado
										? "participant-list__item"
										: "participant-list__item participant-list__item--offline"
								}
							>
								<span className="participant-list__avatar" aria-hidden="true">
									{avatarEmoji(participante.avatar)}
								</span>
								<span className="participant-list__name">
									{participante.nombre_usuario}
									{esUno ? " (vos)" : ""}
									{participante.rol === "docente" ? (
										<span className="participant-list__tag">Docente</span>
									) : null}
								</span>
								<span className="participant-list__badges">
									{termino ? (
										<span className="participant-list__badge participant-list__badge--done">Terminó</span>
									) : null}
									{participante.conectado ? (
										<span className="participant-list__badge participant-list__badge--online">Conectado</span>
									) : (
										<span className="participant-list__badge participant-list__badge--offline">
											Desconectado
											{restantes !== null ? (
												restantes > 0 ? (
													<span aria-hidden="true"> · vuelve en {restantes} s</span>
												) : (
													<span> · esperando que vuelva</span>
												)
											) : null}
										</span>
									)}
								</span>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

export default ParticipantList;
