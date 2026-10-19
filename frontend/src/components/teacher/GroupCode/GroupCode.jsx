import { useEffect, useRef, useState } from "react";

import "./GroupCode.css";

/**
 * Plan B cuando la API del portapapeles no está disponible o fue denegada
 * (contexto no seguro, iframe sin permiso): selecciona un campo temporal y usa
 * el comando clásico de copiar. Devuelve `true` si el navegador lo aceptó.
 */
function copiarConSeleccion(texto) {
	const previo = document.activeElement;
	const campo = document.createElement("textarea");
	campo.value = texto;
	campo.setAttribute("readonly", "");
	campo.style.position = "fixed";
	campo.style.opacity = "0";
	document.body.appendChild(campo);
	campo.select();

	try {
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		campo.remove();
		if (previo instanceof HTMLElement) {
			previo.focus();
		}
	}
}

/**
 * Código de un grupo con botón "Copiar" (RF-022). El resultado se anuncia en una
 * región `status` para lectores de pantalla; si el navegador no permite copiar
 * (contexto no seguro o permiso denegado) se pide copiarlo a mano.
 * `size="large"` agranda el código (pantalla "Grupo creado").
 */
function GroupCode({ codigo, size = "normal" }) {
	const [estado, setEstado] = useState("idle");
	const timeoutRef = useRef(null);

	useEffect(() => () => clearTimeout(timeoutRef.current), []);

	async function copiar() {
		clearTimeout(timeoutRef.current);

		try {
			await navigator.clipboard.writeText(codigo);
			setEstado("copiado");
		} catch {
			setEstado(copiarConSeleccion(codigo) ? "copiado" : "error");
		}

		timeoutRef.current = setTimeout(() => setEstado("idle"), 2500);
	}

	return (
		<span className={size === "large" ? "group-code group-code--large" : "group-code"}>
			<code className="group-code__value" aria-label={`Código del grupo: ${codigo}`}>
				{codigo}
			</code>
			<button type="button" className="group-code__copy" onClick={copiar}>
				Copiar
			</button>
			<span className="group-code__feedback" role="status" aria-live="polite">
				{estado === "copiado" ? "¡Copiado!" : null}
				{estado === "error" ? "No pudimos copiarlo: seleccionalo y copialo a mano." : null}
			</span>
		</span>
	);
}

export default GroupCode;
