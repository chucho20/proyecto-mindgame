import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ConnectionStatus from "../../components/realtime/ConnectionStatus/ConnectionStatus.jsx";
import FinalResults from "../../components/realtime/FinalResults/FinalResults.jsx";
import GameRoom from "../../components/realtime/GameRoom/GameRoom.jsx";
import SalaLobby from "../../components/realtime/SalaLobby/SalaLobby.jsx";
import { useAuth } from "../../context/AuthContext.js";
import { useSala } from "../../context/SalaContext.js";
import { useAccionDeSala } from "../../hooks/useAccionDeSala.js";
import { mensajeDeErrorSala } from "../../utils/salaTiempoReal.js";
import "./LiveRoomPage.css";

function destinosDeSalida(rol, sala) {
	if (rol === "docente") {
		const grupoId = sala?.grupo?.id;

		return [
			...(grupoId ? [{ label: "Volver al grupo", to: `/docente/grupos/${grupoId}` }] : []),
			{ label: "Mis grupos", to: "/docente/grupos" },
		];
	}

	return [
		{ label: "Volver a actividades en vivo", to: "/estudiante/en-vivo" },
		{ label: "Ir a mis grupos", to: "/estudiante/grupos" },
	];
}

/**
 * Pantalla de una sala en vivo para docente y estudiante (RF-019, CU-007): según la fase de la sala muestra
 * la sala de espera, la actividad sincronizada o el cierre (resultado final, sala cerrada, etc.). Al abrirla
 * por enlace o tras recargar recupera el estado entrando de nuevo con el `sala_id` (el servidor responde con
 * el snapshot). Una región `aria-live` siempre presente anuncia entradas, salidas y cambios de fase, y el
 * foco pasa al título de cada fase.
 */
function LiveRoomPage() {
	const { salaId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const contexto = useSala();
	const { sala, fin, restaurarSala, reiniciar } = contexto;
	const rol = user.rol;
	const tituloRef = useRef(null);
	const salaActualRef = useRef(null);
	const [errorCarga, setErrorCarga] = useState("");
	const [otraSalaId, setOtraSalaId] = useState(null);
	const [reintentos, setReintentos] = useState(0);

	const enSalaCorrecta = Boolean(sala) && String(sala.id) === String(salaId);
	const fase = !enSalaCorrecta
		? "cargando"
		: fin
			? "fin"
			: sala.estado === "esperando"
				? "lobby"
				: "en_curso";

	useEffect(() => {
		salaActualRef.current = sala?.id ?? null;
	});

	// Recupera la sala al abrir la pantalla (recarga o enlace directo) si el estado en memoria no es de esta sala.
	useEffect(() => {
		let cancelled = false;

		async function recuperar() {
			setErrorCarga("");

			if (String(salaActualRef.current) === String(salaId)) {
				return;
			}

			try {
				await restaurarSala(salaId);
			} catch (error) {
				if (!cancelled) {
					setErrorCarga(mensajeDeErrorSala(error, "No pudimos entrar a la sala."));
					setOtraSalaId(error?.codigo === "ya_en_otra_sala" ? (error.datos?.sala_id ?? null) : null);
				}
			}
		}

		recuperar();

		return () => {
			cancelled = true;
		};
	}, [salaId, reintentos, restaurarSala]);

	// Cada fase nueva lleva el foco a su título (el cambio de fase también se anuncia en la región aria-live).
	useEffect(() => {
		if (fase !== "cargando") {
			tituloRef.current?.focus();
		}
	}, [fase, fin?.tipo]);

	const retomar = useAccionDeSala(() => contexto.unirseASala({ salaId }));

	function irA(destino) {
		reiniciar();
		navigate(destino);
	}

	const salirAlListado = () => irA(rol === "docente" ? "/docente/grupos" : "/estudiante/en-vivo");

	let contenido;

	if (errorCarga) {
		contenido = (
			<div className="live-room-page__state">
				<p className="rt-notice rt-notice--error" role="alert">
					{errorCarga}
					{otraSalaId ? (
						<>
							{" "}
							<Link to={`${rol === "docente" ? "/docente" : "/estudiante"}/salas/${otraSalaId}`}>
								Ir a la otra sala
							</Link>
						</>
					) : null}
				</p>
				<div className="rt-actions">
					<button
						type="button"
						className="rt-btn rt-btn--primary"
						onClick={() => setReintentos((n) => n + 1)}
					>
						Reintentar
					</button>
					<Link
						to={rol === "docente" ? "/docente/grupos" : "/estudiante/en-vivo"}
						className="rt-btn rt-btn--secondary"
					>
						{rol === "docente" ? "Mis grupos" : "Actividades en vivo"}
					</Link>
				</div>
			</div>
		);
	} else if (fase === "cargando") {
		contenido = <p className="live-room-page__loading">Entrando a la sala...</p>;
	} else if (fase === "fin") {
		contenido = (
			<FinalResults
				fin={fin}
				rol={rol}
				usuarioId={user.id}
				sala={sala}
				recompensa={contexto.recompensa}
				tituloRef={tituloRef}
				destinos={destinosDeSalida(rol, sala)}
				onIr={irA}
				onRetomar={() => retomar.ejecutar()}
				retomando={retomar.ocupado}
				errorRetomar={retomar.error}
			/>
		);
	} else if (fase === "lobby") {
		contenido = (
			<SalaLobby
				rol={rol}
				usuarioId={user.id}
				tituloRef={tituloRef}
				sala={sala}
				participantes={contexto.participantes}
				graciaPorUsuario={contexto.graciaPorUsuario}
				acciones={contexto}
				onSalida={salirAlListado}
			/>
		);
	} else {
		contenido = (
			<GameRoom
				rol={rol}
				usuarioId={user.id}
				tituloRef={tituloRef}
				sala={sala}
				participantes={contexto.participantes}
				graciaPorUsuario={contexto.graciaPorUsuario}
				eventos={contexto.eventos}
				resultados={contexto.resultados}
				desfaseMs={contexto.desfaseMs}
				acciones={contexto}
				onSalida={salirAlListado}
			/>
		);
	}

	const novedades = [...contexto.novedades].reverse().slice(0, 5);

	return (
		<div className="live-room-page">
			{/* Siempre en el DOM: los lectores de pantalla solo anuncian cambios de una región que ya existía. */}
			<div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
				{/* La key nueva en cada anuncio hace que un texto repetido se vuelva a leer. */}
				{contexto.anuncio ? <span key={contexto.anuncio.id}>{contexto.anuncio.texto}</span> : null}
			</div>

			<ConnectionStatus
				caida={contexto.caida}
				errorConexion={contexto.errorConexion}
				aviso={contexto.aviso}
				onDescartarAviso={contexto.descartarAviso}
			/>

			{contenido}

			{(fase === "lobby" || fase === "en_curso") && novedades.length > 0 ? (
				<section className="rt-card live-room-page__news" aria-labelledby="live-room-novedades">
					<h2 id="live-room-novedades" className="rt-card__title">
						Novedades de la sala
					</h2>
					<ul className="live-room-page__news-list">
						{novedades.map((novedad) => (
							<li key={novedad.id}>{novedad.texto}</li>
						))}
					</ul>
				</section>
			) : null}
		</div>
	);
}

export default LiveRoomPage;
