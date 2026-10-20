import { useId, useState } from "react";

import ConfirmDialog from "../../admin/ConfirmDialog/ConfirmDialog.jsx";
import GroupCode from "../../teacher/GroupCode/GroupCode.jsx";
import ParticipantList from "../ParticipantList/ParticipantList.jsx";
import { useAccionDeSala } from "../../../hooks/useAccionDeSala.js";
import { requisitoDeInicio } from "../../../utils/salaTiempoReal.js";
import "../realtime.css";
import "./SalaLobby.css";

const MAX_LONGITUD_INSTRUCCIONES = 2000;

/**
 * Sala de espera (RF-019, CU-007 pasos 3-5). El docente ve el código para compartir, edita las
 * instrucciones y habilita "Iniciar" cuando hay suficientes estudiantes conectados; el estudiante ve a los
 * participantes y espera. `tituloRef` recibe el foco al llegar a esta fase (lo maneja la página).
 */
function SalaLobby({ rol, usuarioId, tituloRef, sala, participantes, graciaPorUsuario, acciones, onSalida }) {
	const idPrefix = useId();
	const esDocente = rol === "docente";
	const requisito = requisitoDeInicio(sala, participantes);
	const [instrucciones, setInstrucciones] = useState(sala.instrucciones ?? "");
	const [guardadas, setGuardadas] = useState(false);
	const [confirmando, setConfirmando] = useState(false);

	const iniciar = useAccionDeSala(acciones.iniciarActividad, { enfriamientoMs: 800 });
	const guardar = useAccionDeSala(acciones.definirInstrucciones, { enfriamientoMs: 800 });
	const cerrar = useAccionDeSala(acciones.cerrarSala);
	const salir = useAccionDeSala(acciones.salirDeSala);

	async function handleGuardar(event) {
		event.preventDefault();
		setGuardadas(false);
		const resultado = await guardar.ejecutar(instrucciones);
		setGuardadas(resultado.ok);
	}

	async function handleCerrar() {
		const resultado = await cerrar.ejecutar();

		if (resultado.ok) {
			setConfirmando(false);
		}
	}

	async function handleSalir() {
		const resultado = await salir.ejecutar();

		if (resultado.ok) {
			onSalida();
		}
	}

	const docenteConectado = participantes.some(
		(participante) => participante.rol === "docente" && participante.conectado,
	);

	return (
		<div className="sala-lobby">
			<header className="sala-lobby__header">
				<p className="sala-lobby__eyebrow">Sala de espera</p>
				<h1 className="sala-lobby__title" tabIndex={-1} ref={tituloRef}>
					{sala.actividad?.titulo ?? "Actividad en vivo"}
				</h1>
				<p className="sala-lobby__meta">
					Grupo {sala.grupo?.nombre ?? "—"}
					{sala.actividad?.descripcion ? ` · ${sala.actividad.descripcion}` : ""}
				</p>
			</header>

			{esDocente && sala.codigo ? (
				<section className="rt-card sala-lobby__code" aria-labelledby={`${idPrefix}-codigo`}>
					<h2 id={`${idPrefix}-codigo`} className="rt-card__title">
						Código de la sala
					</h2>
					<GroupCode codigo={sala.codigo} size="large" etiqueta="Código de la sala" />
					<p className="rt-hint">
						Compartilo con tu grupo. Los estudiantes también ven la sala en "Actividades en vivo" sin
						necesidad de escribirlo.
					</p>
				</section>
			) : null}

			{!esDocente ? (
				<p className={docenteConectado ? "rt-notice" : "rt-notice rt-notice--warning"}>
					{docenteConectado
						? "Estás adentro. Esperá a que tu docente inicie la actividad: va a empezar para todos al mismo tiempo."
						: "Tu docente se desconectó un momento. Esperá, la sala sigue abierta."}
				</p>
			) : null}

			<div className="sala-lobby__grid">
				<div className="rt-card">
					{esDocente ? (
						<form className="sala-lobby__form" onSubmit={handleGuardar}>
							<label htmlFor={`${idPrefix}-instrucciones`} className="sala-lobby__label">
								Instrucciones para los estudiantes
							</label>
							<textarea
								id={`${idPrefix}-instrucciones`}
								className="sala-lobby__textarea"
								rows={5}
								maxLength={MAX_LONGITUD_INSTRUCCIONES}
								value={instrucciones}
								onChange={(event) => {
									setInstrucciones(event.target.value);
									setGuardadas(false);
								}}
								aria-describedby={`${idPrefix}-instrucciones-ayuda`}
							/>
							<p id={`${idPrefix}-instrucciones-ayuda`} className="rt-hint">
								Se muestran a todos antes de empezar. Si las dejás vacías se usa la descripción de la
								actividad.
							</p>
							<div className="rt-actions">
								<button type="submit" className="rt-btn rt-btn--secondary" disabled={guardar.ocupado}>
									{guardar.ocupado ? "Guardando..." : "Guardar instrucciones"}
								</button>
							</div>
							{guardar.error ? (
								<p className="rt-notice rt-notice--error" role="alert">
									{guardar.error}
								</p>
							) : null}
							{guardadas ? (
								<p className="rt-notice rt-notice--success" role="status">
									Instrucciones guardadas: ya las ven todos.
								</p>
							) : null}
						</form>
					) : (
						<>
							<h2 className="rt-card__title">Instrucciones</h2>
							<p className="sala-lobby__instructions">
								{sala.instrucciones || "Tu docente todavía no escribió instrucciones."}
							</p>
						</>
					)}
				</div>

				<div className="rt-card">
					<ParticipantList
						participantes={participantes}
						graciaPorUsuario={graciaPorUsuario}
						usuarioId={usuarioId}
					/>
				</div>
			</div>

			{esDocente ? (
				<section className="rt-card sala-lobby__start" aria-labelledby={`${idPrefix}-iniciar`}>
					<h2 id={`${idPrefix}-iniciar`} className="rt-card__title">
						Iniciar la actividad
					</h2>
					<p id={`${idPrefix}-requisito`} className="sala-lobby__requirement">
						{requisito.puedeIniciar
							? `Hay ${requisito.conectados} ${requisito.conectados === 1 ? "estudiante conectado" : "estudiantes conectados"}: ya podés iniciar.`
							: `Faltan estudiantes: hacen falta ${requisito.requeridos} conectados y hay ${requisito.conectados}.`}
					</p>
					<div className="rt-actions">
						<button
							type="button"
							className="rt-btn rt-btn--primary"
							onClick={() => iniciar.ejecutar()}
							disabled={!requisito.puedeIniciar || iniciar.ocupado}
							aria-describedby={`${idPrefix}-requisito`}
						>
							{iniciar.ocupado ? "Iniciando..." : "Iniciar actividad"}
						</button>
						<button type="button" className="rt-btn rt-btn--danger" onClick={() => setConfirmando(true)}>
							Cerrar sala
						</button>
					</div>
					{iniciar.error ? (
						<p className="rt-notice rt-notice--error" role="alert">
							{iniciar.error}
						</p>
					) : null}
				</section>
			) : (
				<div className="rt-actions">
					<button
						type="button"
						className="rt-btn rt-btn--secondary"
						onClick={handleSalir}
						disabled={salir.ocupado}
					>
						{salir.ocupado ? "Saliendo..." : "Salir de la sala"}
					</button>
					{salir.error ? (
						<p className="rt-notice rt-notice--error" role="alert">
							{salir.error}
						</p>
					) : null}
				</div>
			)}

			{confirmando ? (
				<ConfirmDialog
					title="Cerrar la sala"
					confirmLabel="Cerrar sala"
					busyLabel="Cerrando..."
					busy={cerrar.ocupado}
					error={cerrar.error}
					onConfirm={handleCerrar}
					onCancel={() => setConfirmando(false)}
				>
					<p>
						¿Seguro que querés cerrar la sala de <strong>{sala.actividad?.titulo}</strong>?
					</p>
					<p>
						Todos los estudiantes van a salir. La actividad no se completa: no se registra la participación ni
						se otorgan puntos.
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default SalaLobby;
