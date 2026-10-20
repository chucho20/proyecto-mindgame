import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useState } from "react";

import { crearClienteSala } from "../services/salaClient.js";
import { estadoInicialSala, salaReducer } from "../utils/salaTiempoReal.js";

/**
 * Estado y acciones de la sala en tiempo real del usuario (RF-019). Lo instancia UNA sola vez el
 * `SalaProvider` (un socket por sesión, que sobrevive a la navegación entre el lobby, la actividad y el
 * resultado); las pantallas lo consumen con `useSala()`.
 *
 * Estado:
 * - `conexion`: "desconectado" | "conectando" | "conectado" | "reconectando" | "error".
 * - `errorConexion`: `{ codigo, mensaje }` si el handshake fue rechazado (sesión, rol, demasiadas conexiones).
 * - `caida`: `{ desde, graciaMs }` mientras el socket está caído con una sala abierta (para la cuenta regresiva).
 * - `aviso`: `{ id, texto }` tras recuperarse de una caída.
 * - `sala`, `participantes`, `eventos` (ordenados por `secuencia`), `resultados` (docente), `novedades`,
 *   `graciaPorUsuario`, `desfaseMs` (reloj del servidor menos el local), `fin`, `recompensa`, `anuncio`.
 * Acciones (todas devuelven promesas que rechazan con `ErrorSala`, cuyo `message` ya está en español):
 * `conectar`, `crearSala`, `unirseASala`, `restaurarSala`, `listarDisponibles`, `salirDeSala`, `cerrarSala`,
 * `definirInstrucciones`, `iniciarActividad`, `enviarEvento`, `enviarResultado`, `finalizarActividad`,
 * `reiniciar` (sale de la pantalla de la sala y corta la conexión), `descartarAviso`.
 */
export function useSalaTiempoReal({ token, rol }) {
	const [estado, dispatch] = useReducer(salaReducer, estadoInicialSala);
	const [conexion, setConexion] = useState("desconectado");
	const [errorConexion, setErrorConexion] = useState(null);
	const [caida, setCaida] = useState(null);
	const [aviso, setAviso] = useState(null);
	const [cliente] = useState(() =>
		crearClienteSala(
			{
				dispatch,
				conexion: setConexion,
				caida: setCaida,
				errorConexion: setErrorConexion,
				aviso: setAviso,
			},
			{ token, rol },
		),
	);

	// Layout effect: corre antes que los efectos de las pantallas hijas, que pueden conectar apenas se monta la sesión.
	useLayoutEffect(() => {
		cliente.actualizarCredenciales({ token, rol });
	}, [cliente, token, rol]);

	const descartarAviso = useCallback(() => setAviso(null), []);

	// Al cerrar sesión (token nulo) o desmontar: corta el socket y deja todo en blanco.
	useEffect(
		() => () => {
			cliente.destruir();
			dispatch({ tipo: "reiniciar" });
			setConexion("desconectado");
			setErrorConexion(null);
			setCaida(null);
			setAviso(null);
		},
		[token, cliente],
	);

	return useMemo(
		() => ({ ...estado, conexion, errorConexion, caida, aviso, descartarAviso, ...cliente }),
		[estado, conexion, errorConexion, caida, aviso, descartarAviso, cliente],
	);
}
