import { useId, useState } from "react";

import ConfirmDialog from "../../admin/ConfirmDialog/ConfirmDialog.jsx";
import ActivityTimer from "../ActivityTimer/ActivityTimer.jsx";
import EventFeed from "../EventFeed/EventFeed.jsx";
import ParticipantList from "../ParticipantList/ParticipantList.jsx";
import { useAccionDeSala } from "../../../hooks/useAccionDeSala.js";
import { idsQueTerminaron, resumenDeResultado } from "../../../utils/salaTiempoReal.js";
import "../realtime.css";
import "./GameRoom.css";

const MAX_LONGITUD_TEXTO = 200;
const ENFRIAMIENTO_MS = 900;

/**
 * Pantalla de la actividad sincronizada (RF-019, CU-007 pasos 5-6). Todos ven lo mismo: título, instrucciones,
 * cronómetro del servidor, participantes y feed de eventos. El estudiante interactúa con eventos genéricos
 * (`listo`, `aporte`, `termino`) y reporta su resultado; el docente ve quién terminó, los resultados que
 * llegan, y finaliza la actividad (otorga los puntos) o cierra la sala. Los botones se bloquean un instante
 * tras cada envío para no acercarse al límite de ritmo del servidor.
 */
function GameRoom({
	rol,
	usuarioId,
	tituloRef,
	sala,
	participantes,
	graciaPorUsuario,
	eventos,
	resultados,
	desfaseMs,
	acciones,
	onSalida,
}) {
	const idPrefix = useId();
	const esDocente = rol === "docente";
	const [texto, setTexto] = useState("");
	const [aviso, setAviso] = useState("");
	const [confirmando, setConfirmando] = useState(null);

	// Mientras el socket está caído (reconectando) no se puede enviar nada: se deshabilitan los envíos.
	const sinConexion = Boolean(acciones.caida) || acciones.conexion !== "conectado";
	const terminaron = idsQueTerminaron(eventos, resultados);
	const yaTermino = terminaron.has(usuarioId);
	const aportes = eventos.filter(
		(evento) => evento.tipo === "aporte" && evento.usuario_id === usuarioId,
	).length;
	const yaEstaListo = eventos.some((evento) => evento.tipo === "listo" && evento.usuario_id === usuarioId);

	const listo = useAccionDeSala(() => acciones.enviarEvento("listo"), { enfriamientoMs: ENFRIAMIENTO_MS });
	const aportar = useAccionDeSala((valor) => acciones.enviarEvento("aporte", { texto: valor }), {
		enfriamientoMs: ENFRIAMIENTO_MS,
	});
	const terminar = useAccionDeSala(
		async () => {
			await acciones.enviarResultado({ terminado: true, aportes, listo: yaEstaListo });
			await acciones.enviarEvento("termino");
		},
		{ enfriamientoMs: ENFRIAMIENTO_MS },
	);
	const avisar = useAccionDeSala((valor) => acciones.enviarEvento("aviso", { texto: valor }), {
		enfriamientoMs: ENFRIAMIENTO_MS,
	});
	const finalizar = useAccionDeSala(() => acciones.finalizarActividad(sala.id));
	const cerrar = useAccionDeSala(() => acciones.cerrarSala());
	const salir = useAccionDeSala(() => acciones.salirDeSala());

	async function handleAporte(event) {
		event.preventDefault();
		const limpio = texto.trim();

		if (!limpio) {
			return;
		}

		const resultado = await aportar.ejecutar(limpio);

		if (resultado.ok) {
			setTexto("");
		}
	}

	async function handleAviso(event) {
		event.preventDefault();
		const limpio = aviso.trim();

		if (!limpio) {
			return;
		}

		const resultado = await avisar.ejecutar(limpio);

		if (resultado.ok) {
			setAviso("");
		}
	}

	// Abrir o cerrar un diálogo descarta los errores de intentos anteriores (cada uno muestra solo el suyo).
	function abrirDialogo(tipo) {
		finalizar.limpiarError();
		cerrar.limpiarError();
		salir.limpiarError();
		setConfirmando(tipo);
	}

	async function handleConfirmar() {
		if (confirmando === "finalizar") {
			await finalizar.ejecutar();
		} else if (confirmando === "cerrar") {
			await cerrar.ejecutar();
		} else if (confirmando === "salir") {
			const resultado = await salir.ejecutar();

			if (resultado.ok) {
				onSalida();
			}
		}
	}

	const dialogoOcupado = finalizar.ocupado || cerrar.ocupado || salir.ocupado;
	const dialogoError =
		{ finalizar: finalizar.error, cerrar: cerrar.error, salir: salir.error }[confirmando] ?? "";

	return (
		<div className="game-room">
			<header className="game-room__header">
				<div className="game-room__heading">
					<p className="game-room__eyebrow">Actividad en curso</p>
					<h1 className="game-room__title" tabIndex={-1} ref={tituloRef}>
						{sala.actividad?.titulo ?? "Actividad en vivo"}
					</h1>
					<p className="game-room__meta">Grupo {sala.grupo?.nombre ?? "—"}</p>
				</div>
				<ActivityTimer iniciadaEn={sala.iniciada_en} desfaseMs={desfaseMs} />
			</header>

			<section className="rt-card" aria-labelledby={`${idPrefix}-instrucciones`}>
				<h2 id={`${idPrefix}-instrucciones`} className="rt-card__title">
					Instrucciones
				</h2>
				<p className="game-room__instructions">
					{sala.instrucciones || "Sin instrucciones para esta actividad."}
				</p>
			</section>

			{!esDocente ? (
				<section className="rt-card" aria-labelledby={`${idPrefix}-participar`}>
					<h2 id={`${idPrefix}-participar`} className="rt-card__title">
						Tu participación
					</h2>

					{yaTermino ? (
						<p className="rt-notice rt-notice--success" role="status">
							Ya avisaste que terminaste. Esperá a que tu docente cierre la actividad para ver tu resultado.
						</p>
					) : null}

					<div className="rt-actions">
						<button
							type="button"
							className="rt-btn rt-btn--secondary"
							onClick={() => listo.ejecutar()}
							disabled={listo.ocupado || yaTermino || sinConexion}
						>
							{yaEstaListo ? "¡Listo! otra vez" : "¡Listo!"}
						</button>
					</div>
					{listo.error ? (
						<p className="rt-notice rt-notice--error" role="alert">
							{listo.error}
						</p>
					) : null}

					<form className="game-room__form" onSubmit={handleAporte}>
						<label htmlFor={`${idPrefix}-aporte`} className="game-room__label">
							Tu aporte para el grupo
						</label>
						<div className="game-room__row">
							<input
								id={`${idPrefix}-aporte`}
								type="text"
								className="game-room__input"
								value={texto}
								onChange={(event) => setTexto(event.target.value)}
								maxLength={MAX_LONGITUD_TEXTO}
								autoComplete="off"
								placeholder="Escribí una idea corta"
								disabled={yaTermino}
							/>
							<button
								type="submit"
								className="rt-btn rt-btn--primary"
								disabled={aportar.ocupado || yaTermino || sinConexion || !texto.trim()}
							>
								{aportar.ocupado ? "Enviando..." : "Enviar aporte"}
							</button>
						</div>
						{aportar.error ? (
							<p className="rt-notice rt-notice--error" role="alert">
								{aportar.error}
							</p>
						) : null}
					</form>

					<div className="rt-actions">
						<button
							type="button"
							className="rt-btn rt-btn--primary"
							onClick={() => terminar.ejecutar()}
							disabled={terminar.ocupado || yaTermino || sinConexion}
						>
							{terminar.ocupado ? "Enviando..." : "Terminé"}
						</button>
						<button type="button" className="rt-btn rt-btn--danger" onClick={() => abrirDialogo("salir")}>
							Salir de la sala
						</button>
					</div>
					{terminar.error ? (
						<p className="rt-notice rt-notice--error" role="alert">
							{terminar.error}
						</p>
					) : null}
				</section>
			) : (
				<section className="rt-card" aria-labelledby={`${idPrefix}-control`}>
					<h2 id={`${idPrefix}-control`} className="rt-card__title">
						Control de la actividad
					</h2>

					<form className="game-room__form" onSubmit={handleAviso}>
						<label htmlFor={`${idPrefix}-aviso`} className="game-room__label">
							Enviar un aviso a la sala
						</label>
						<div className="game-room__row">
							<input
								id={`${idPrefix}-aviso`}
								type="text"
								className="game-room__input"
								value={aviso}
								onChange={(event) => setAviso(event.target.value)}
								maxLength={MAX_LONGITUD_TEXTO}
								autoComplete="off"
								placeholder="Ej: Les quedan cinco minutos"
							/>
							<button
								type="submit"
								className="rt-btn rt-btn--secondary"
								disabled={avisar.ocupado || sinConexion || !aviso.trim()}
							>
								{avisar.ocupado ? "Enviando..." : "Enviar aviso"}
							</button>
						</div>
						{avisar.error ? (
							<p className="rt-notice rt-notice--error" role="alert">
								{avisar.error}
							</p>
						) : null}
					</form>

					<div className="rt-actions">
						<button
							type="button"
							className="rt-btn rt-btn--primary"
							onClick={() => abrirDialogo("finalizar")}
						>
							Finalizar actividad
						</button>
						<button type="button" className="rt-btn rt-btn--danger" onClick={() => abrirDialogo("cerrar")}>
							Cerrar sala sin finalizar
						</button>
					</div>
				</section>
			)}

			{esDocente ? (
				<section className="rt-card" aria-labelledby={`${idPrefix}-resultados`}>
					<h2 id={`${idPrefix}-resultados`} className="rt-card__title">
						Resultados que van llegando
					</h2>
					{Object.keys(resultados).length === 0 ? (
						<p className="rt-hint">Todavía ningún estudiante informó su resultado.</p>
					) : (
						<ul className="game-room__results">
							{Object.values(resultados).map((item) => (
								<li key={item.usuario_id} className="game-room__result">
									<strong>{item.nombre_usuario}</strong>
									<span>{resumenDeResultado(item.resultado)}</span>
								</li>
							))}
						</ul>
					)}
				</section>
			) : null}

			<div className="game-room__grid">
				<div className="rt-card">
					<ParticipantList
						participantes={participantes}
						graciaPorUsuario={graciaPorUsuario}
						usuarioId={usuarioId}
						terminaron={esDocente ? terminaron : undefined}
					/>
				</div>
				<div className="rt-card">
					<EventFeed eventos={eventos} usuarioId={usuarioId} />
				</div>
			</div>

			{confirmando === "finalizar" ? (
				<ConfirmDialog
					title="Finalizar la actividad"
					confirmLabel="Finalizar"
					busyLabel="Finalizando..."
					busy={dialogoOcupado}
					error={dialogoError}
					onConfirm={handleConfirmar}
					onCancel={() => abrirDialogo(null)}
				>
					<p>
						Se registra la participación de cada estudiante y se otorgan los puntos de la actividad a quienes
						la completaron.
					</p>
					<p>
						Por ahora {terminaron.size} de {participantes.filter((p) => p.rol === "estudiante").length}{" "}
						estudiantes avisaron que terminaron.
					</p>
				</ConfirmDialog>
			) : null}

			{confirmando === "cerrar" ? (
				<ConfirmDialog
					title="Cerrar la sala sin finalizar"
					confirmLabel="Cerrar sala"
					busyLabel="Cerrando..."
					busy={dialogoOcupado}
					error={dialogoError}
					onConfirm={handleConfirmar}
					onCancel={() => abrirDialogo(null)}
				>
					<p>La actividad se cancela: no se registra la participación ni se otorgan puntos.</p>
					<p>Si querés que cuenten los resultados, usá "Finalizar actividad".</p>
				</ConfirmDialog>
			) : null}

			{confirmando === "salir" ? (
				<ConfirmDialog
					title="Salir de la actividad"
					confirmLabel="Salir"
					busyLabel="Saliendo..."
					busy={dialogoOcupado}
					error={dialogoError}
					onConfirm={handleConfirmar}
					onCancel={() => abrirDialogo(null)}
				>
					<p>
						La actividad está en curso. Si salís, queda constancia de que la abandonaste y no recibís puntos.
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default GameRoom;
