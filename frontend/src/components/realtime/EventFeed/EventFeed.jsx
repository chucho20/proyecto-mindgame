import { textoDeEvento } from "../../../utils/salaTiempoReal.js";
import "../realtime.css";
import "./EventFeed.css";

function formatearHora(iso) {
	const fecha = new Date(iso);

	return Number.isNaN(fecha.getTime())
		? ""
		: fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * Feed de eventos de la actividad (`actividad:evento`), del más nuevo al más viejo. Es un `log` sin
 * anuncio automático: con muchos estudiantes leer cada evento en voz alta tapa todo lo demás; las novedades
 * importantes (inicio, entradas y salidas) se anuncian aparte.
 */
function EventFeed({ eventos, usuarioId }) {
	const recientes = [...eventos].reverse();

	return (
		<section className="event-feed" aria-labelledby="event-feed-titulo">
			<h2 id="event-feed-titulo" className="rt-card__title">
				Lo que está pasando
			</h2>

			{recientes.length === 0 ? (
				<p className="rt-hint">
					Todavía no hay movimiento. Los aportes de todos aparecen acá en tiempo real.
				</p>
			) : (
				<ol
					className="event-feed__list"
					role="log"
					aria-live="off"
					aria-label="Eventos de la actividad, del más nuevo al más viejo"
				>
					{recientes.map((evento) => (
						<li
							key={evento.secuencia}
							className={
								evento.usuario_id === usuarioId
									? "event-feed__item event-feed__item--own"
									: "event-feed__item"
							}
						>
							<span className="event-feed__text">{textoDeEvento(evento)}</span>
							<time className="event-feed__time" dateTime={evento.timestamp}>
								{formatearHora(evento.timestamp)}
							</time>
						</li>
					))}
				</ol>
			)}
		</section>
	);
}

export default EventFeed;
