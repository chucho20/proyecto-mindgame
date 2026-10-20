import "../realtime.css";
import "./RoomCard.css";

const ETIQUETA_DE_ESTADO = {
	esperando: "Esperando participantes",
	en_curso: "En curso",
};

/**
 * Sala abierta que el estudiante puede ver porque pertenece a su grupo (resumen de `sala:listar_disponibles`).
 * `onEntrar` recibe el resumen; mientras `entrando` el botón se bloquea para no repetir el pedido.
 */
function RoomCard({ sala, onEntrar, entrando = false }) {
	return (
		<li className="room-card">
			<div className="room-card__icon" aria-hidden="true">
				🎲
			</div>
			<div className="room-card__body">
				<h3 className="room-card__title">{sala.actividad.titulo}</h3>
				<p className="room-card__meta">
					Grupo {sala.grupo.nombre} · {sala.total_estudiantes}{" "}
					{sala.total_estudiantes === 1 ? "estudiante" : "estudiantes"} adentro
				</p>
				<span
					className={
						sala.estado === "en_curso" ? "room-card__state room-card__state--live" : "room-card__state"
					}
				>
					{ETIQUETA_DE_ESTADO[sala.estado] ?? sala.estado}
				</span>
			</div>
			<button
				type="button"
				className="rt-btn rt-btn--primary"
				onClick={() => onEntrar(sala)}
				disabled={entrando}
				aria-label={`Entrar a la sala de ${sala.actividad.titulo}`}
			>
				{entrando ? "Entrando..." : "Entrar"}
			</button>
		</li>
	);
}

export default RoomCard;
