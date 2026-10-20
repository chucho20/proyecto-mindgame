import { useAhora } from "../../../hooks/useAhora.js";
import { formatearCronometro, milisegundosTranscurridos } from "../../../utils/salaTiempoReal.js";
import "./ActivityTimer.css";

/**
 * Cronómetro compartido de la actividad: mide desde `iniciada_en` con el reloj del servidor (se corrige
 * el desfase del equipo con `desfaseMs`), así todos ven el mismo tiempo aunque sus relojes difieran.
 * Es un `timer` sin anuncio automático: leerlo cada segundo molestaría a quien usa lector de pantalla.
 */
function ActivityTimer({ iniciadaEn, desfaseMs }) {
	const ahora = useAhora(Boolean(iniciadaEn));

	return (
		<p className="activity-timer">
			<span className="activity-timer__label">Tiempo</span>
			<span className="activity-timer__value" role="timer" aria-live="off">
				{formatearCronometro(milisegundosTranscurridos(iniciadaEn, desfaseMs, ahora))}
			</span>
		</p>
	);
}

export default ActivityTimer;
