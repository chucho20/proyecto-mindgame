import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.js";
import { useSala } from "../../../context/SalaContext.js";
import "../realtime.css";
import "./SalaActivaBanner.css";

/**
 * Aviso para volver a la sala en vivo cuando el usuario navegó a otra pantalla sin salir de ella (la
 * conexión sigue abierta), o para enterarse de que la sala terminó o se cerró mientras estaba en otra pantalla.
 * No se muestra en las propias pantallas de la sala ni en las de "actividades en vivo", que ya lo informan.
 */
function SalaActivaBanner() {
	const { user } = useAuth();
	const { sala, fin } = useSala();
	const { pathname } = useLocation();

	if (!sala || pathname.includes("/salas/") || pathname.endsWith("/en-vivo")) {
		return null;
	}

	// "no_encontrada" y "reemplazada" se resuelven en la propia pantalla de la sala.
	if (fin && !["finalizada", "cerrada"].includes(fin.tipo)) {
		return null;
	}

	const base = user?.rol === "docente" ? "/docente" : "/estudiante";
	const titulo = sala.actividad?.titulo ? `: ${sala.actividad.titulo}` : "";
	let texto = `Estás en una sala en vivo${titulo}.`;
	let enlace = "Volver a la sala";

	if (fin?.tipo === "finalizada") {
		texto = `La actividad en vivo terminó${titulo}.`;
		enlace = "Ver resultado";
	} else if (fin?.tipo === "cerrada") {
		texto = `Se cerró la sala en vivo${titulo}.`;
		enlace = "Ver detalle";
	}

	return (
		<p className="sala-activa-banner" role="status">
			<span>{texto}</span>
			<Link to={`${base}/salas/${sala.id}`} className="rt-btn rt-btn--primary sala-activa-banner__link">
				{enlace}
			</Link>
		</p>
	);
}

export default SalaActivaBanner;
