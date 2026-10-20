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
 * `size="large"` agranda el código (pantalla "Grupo creado"). `etiqueta` es el texto que leen
 * los lectores de pantalla antes del código (por defecto "Código del grupo"; la sala en vivo usa "Código de la sala").
 */
function GroupCode({ codigo, size = "normal", etiqueta = "Código del grupo" }) {
	const [estado, setEstado] = useState("idle");
	const timeoutRef = useRef(null);
	const montadoRef = useRef(true);

	useEffect(() => {
		montadoRef.current = true;

		return () => {
			montadoRef.current = false;
			clearTimeout(timeoutRef.current);
		};
	}, []);

	async function copiar() {
		clearTimeout(timeoutRef.current);
		let resultado = "copiado";

		try {
			await navigator.clipboard.writeText(codigo);
		} catch {
			resultado = copiarConSeleccion(codigo) ? "copiado" : "error";
		}

		// Si el componente se desmontó mientras se copiaba no hay nada que actualizar.
		if (!montadoRef.current) {
			return;
		}

		setEstado(resultado);
		timeoutRef.current = setTimeout(() => setEstado("idle"), 2500);
	}

	return (
		<span className={size === "large" ? "group-code group-code--large" : "group-code"}>
			<code className="group-code__value">
				<span className="group-code__sr">{etiqueta}: </span>
				{codigo}
			</code>
			<button type="button" className="group-code__copy" onClick={copiar}>
				Copiar
			</button>
			{/* La región vive siempre en el DOM (vacía y oculta visualmente) para que se anuncie el cambio. */}
			<span
				className={
					estado === "error" ? "group-code__feedback group-code__feedback--error" : "group-code__feedback"
				}
				role="status"
				aria-live="polite"
			>
				{estado === "copiado" ? "¡Copiado!" : null}
				{estado === "error" ? "No pudimos copiarlo: seleccionalo y copialo a mano." : null}
			</span>
		</span>
	);
}

export default GroupCode;
