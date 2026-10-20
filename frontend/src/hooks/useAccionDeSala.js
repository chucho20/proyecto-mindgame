import { useCallback, useEffect, useRef, useState } from "react";

import { mensajeDeErrorSala } from "../utils/salaTiempoReal.js";

const ENFRIAMIENTO_POR_LIMITE_MS = 4000;

/**
 * Envuelve una acción de la sala (promesa) para los botones: marca `ocupado` mientras corre y un instante
 * después (`enfriamientoMs`, evita repetir clics y acercarse al límite de ritmo del servidor), guarda el
 * mensaje de error en español y, si el servidor respondió `demasiadas_solicitudes`, alarga la espera.
 * `ejecutar(...args)` nunca rechaza: devuelve `{ ok: true, valor }` o `{ ok: false, error }`.
 */
export function useAccionDeSala(accion, { enfriamientoMs = 0 } = {}) {
	const [ocupado, setOcupado] = useState(false);
	const [error, setError] = useState("");
	const montadoRef = useRef(true);
	const accionRef = useRef(accion);

	useEffect(() => {
		accionRef.current = accion;
	});

	useEffect(() => {
		montadoRef.current = true;

		return () => {
			montadoRef.current = false;
		};
	}, []);

	const ejecutar = useCallback(
		async (...argumentos) => {
			setOcupado(true);
			setError("");
			let espera = enfriamientoMs;
			let resultado;

			try {
				resultado = { ok: true, valor: await accionRef.current(...argumentos) };
			} catch (fallo) {
				if (montadoRef.current) {
					setError(mensajeDeErrorSala(fallo));
				}

				if (fallo?.codigo === "demasiadas_solicitudes") {
					espera = ENFRIAMIENTO_POR_LIMITE_MS;
				}

				resultado = { ok: false, error: fallo };
			}

			if (espera > 0) {
				await new Promise((resolver) => setTimeout(resolver, espera));
			}

			if (montadoRef.current) {
				setOcupado(false);
			}

			return resultado;
		},
		[enfriamientoMs],
	);

	const limpiarError = useCallback(() => setError(""), []);

	return { ejecutar, ocupado, error, limpiarError };
}
