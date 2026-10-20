import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useAhora } from "../../../hooks/useAhora.js";
import { segundosRestantes } from "../../../utils/salaTiempoReal.js";
import "../realtime.css";
import "./ConnectionStatus.css";

const SEGUNDOS_QUE_SE_MUESTRA_EL_AVISO = 7;

/**
 * Estado de la conexión de la sala (RF-019, desconexión controlada): mientras el socket está caído con
 * una sala abierta muestra "Reconectando…" con la cuenta regresiva de la gracia que da el servidor; cuando
 * se vence avisa que sigue intentando, y al recuperarse confirma que se restauró el estado.
 * Un handshake rechazado (sesión vencida, rol, demasiadas pestañas) se informa como error.
 * La región vive siempre en el DOM (aria-live) y la cuenta regresiva queda fuera del anuncio: solo se
 * leen los cambios de estado, no cada segundo.
 */
function ConnectionStatus({ caida, errorConexion, aviso, onDescartarAviso }) {
	const ahora = useAhora(Boolean(caida));
	const restantes = caida ? segundosRestantes(caida.desde, caida.graciaMs, ahora) : 0;
	const vencida = Boolean(caida) && restantes === 0;
	const avisoId = aviso?.id;

	// El aviso de "te reconectaste" se retira solo.
	useEffect(() => {
		if (!avisoId) {
			return undefined;
		}

		const temporizador = setTimeout(() => onDescartarAviso?.(), SEGUNDOS_QUE_SE_MUESTRA_EL_AVISO * 1000);

		return () => clearTimeout(temporizador);
	}, [avisoId, onDescartarAviso]);

	const requiereSesion = ["no_autorizado", "token_invalido", "sesion_expirada"].includes(
		errorConexion?.codigo,
	);

	return (
		<div className="connection-status" role="status" aria-live="polite">
			{errorConexion ? (
				<p className="connection-status__banner connection-status__banner--error">
					<span>{errorConexion.mensaje}</span>
					{requiereSesion ? (
						<Link to="/login" className="connection-status__link">
							Ir a iniciar sesión
						</Link>
					) : null}
				</p>
			) : null}

			{caida ? (
				<p
					className={
						vencida
							? "connection-status__banner connection-status__banner--warning"
							: "connection-status__banner connection-status__banner--reconnecting"
					}
				>
					<span className="connection-status__pulse" aria-hidden="true" />
					<span>
						{vencida
							? "Perdiste la conexión y ya pasó el tiempo de espera. Seguimos intentando reconectar: si volvés, podés reingresar a la sala."
							: "Reconectando… Perdiste la conexión con la sala."}
					</span>
					{!vencida ? (
						<span className="connection-status__count" aria-hidden="true">
							Tenés {restantes} s para volver
						</span>
					) : null}
				</p>
			) : null}

			{aviso ? (
				<p className="connection-status__banner connection-status__banner--success">
					<span>{aviso.texto}</span>
					<button
						type="button"
						className="connection-status__close"
						onClick={onDescartarAviso}
						aria-label="Cerrar aviso"
					>
						×
					</button>
				</p>
			) : null}
		</div>
	);
}

export default ConnectionStatus;
