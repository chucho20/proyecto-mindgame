import { useEffect, useState } from "react";

/**
 * Reloj local que se actualiza cada `intervaloMs` mientras `activo` sea verdadero (cronómetros y
 * cuentas regresivas). Se actualiza apenas se activa para no mostrar un valor viejo el primer segundo.
 */
export function useAhora(activo = true, intervaloMs = 1000) {
	const [ahora, setAhora] = useState(() => Date.now());

	useEffect(() => {
		if (!activo) {
			return undefined;
		}

		const inmediato = setTimeout(() => setAhora(Date.now()), 0);
		const intervalo = setInterval(() => setAhora(Date.now()), intervaloMs);

		return () => {
			clearTimeout(inmediato);
			clearInterval(intervalo);
		};
	}, [activo, intervaloMs]);

	return ahora;
}
