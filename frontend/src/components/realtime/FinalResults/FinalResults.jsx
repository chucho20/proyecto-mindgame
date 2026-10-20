import PositiveMessage from "../../student/PositiveMessage/PositiveMessage.jsx";
import ProgressionFeedback from "../../student/ProgressionFeedback/ProgressionFeedback.jsx";
import { formatearNumero } from "../../../utils/estadisticas.js";
import { mensajeDeCierre } from "../../../utils/salaTiempoReal.js";
import "../realtime.css";
import "./FinalResults.css";

const ESTADO_DEL_RESULTADO = {
	completo: "Completó",
	abandono: "Salió antes de terminar",
};

/**
 * Cierre de la sala (CU-007 paso 8): resultado de la actividad con puntos y recompensa, o el motivo por el
 * que la sala se cerró / no se encontró / se tomó desde otra pestaña. El docente ve la tabla completa de
 * resultados; el estudiante, el suyo. `destinos` son los botones de salida (la página limpia la sala antes de navegar).
 */
function FinalResults({
	fin,
	rol,
	usuarioId,
	sala,
	recompensa,
	tituloRef,
	destinos,
	onIr,
	onRetomar,
	retomando,
	errorRetomar,
}) {
	const esDocente = rol === "docente";
	const titulo = sala?.actividad?.titulo;
	const salida = (
		<div className="rt-actions">
			{destinos.map((destino, indice) => (
				<button
					key={destino.to}
					type="button"
					className={indice === 0 ? "rt-btn rt-btn--primary" : "rt-btn rt-btn--secondary"}
					onClick={() => onIr(destino.to)}
				>
					{destino.label}
				</button>
			))}
		</div>
	);

	if (fin.tipo === "finalizada") {
		const propio = fin.resultados.find((resultado) => resultado.usuario_id === usuarioId);
		const completaron = fin.resultados.filter((resultado) => resultado.estado === "completo").length;
		const puntos = recompensa?.puntos_obtenidos ?? propio?.puntos_obtenidos ?? 0;

		return (
			<div className="final-results">
				<header>
					<p className="final-results__eyebrow">Actividad finalizada</p>
					<h1 className="final-results__title" tabIndex={-1} ref={tituloRef}>
						{titulo ? `Terminó "${titulo}"` : "La actividad terminó"}
					</h1>
				</header>

				{esDocente ? (
					<section className="rt-card" aria-labelledby="final-results-tabla">
						<h2 id="final-results-tabla" className="rt-card__title">
							Resultados del grupo
						</h2>
						<p className="rt-hint">
							{completaron} de {fin.resultados.length} estudiantes completaron la actividad. Los puntos se
							otorgan una sola vez por actividad.
						</p>
						{fin.resultados.length === 0 ? (
							<p className="rt-hint">No hubo estudiantes en la sala.</p>
						) : (
							<div className="final-results__table-wrapper">
								<table className="final-results__table">
									<caption className="visually-hidden">Resultados de cada estudiante</caption>
									<thead>
										<tr>
											<th scope="col">Estudiante</th>
											<th scope="col">Estado</th>
											<th scope="col">Eventos enviados</th>
											<th scope="col">Puntos</th>
										</tr>
									</thead>
									<tbody>
										{fin.resultados.map((resultado) => (
											<tr key={resultado.usuario_id}>
												<th scope="row">{resultado.nombre_usuario}</th>
												<td>{ESTADO_DEL_RESULTADO[resultado.estado] ?? resultado.estado}</td>
												<td>{formatearNumero(resultado.eventos_enviados)}</td>
												<td>{formatearNumero(resultado.puntos_obtenidos)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</section>
				) : (
					<section className="rt-card" aria-labelledby="final-results-propio">
						<h2 id="final-results-propio" className="rt-card__title">
							Tu resultado
						</h2>
						{propio ? (
							<>
								<p className="final-results__summary">
									{propio.estado === "completo"
										? "¡Completaste la actividad con tu grupo!"
										: "Saliste antes de que terminara la actividad."}
								</p>
								<dl className="final-results__stats">
									<div>
										<dt>Eventos que enviaste</dt>
										<dd>{formatearNumero(propio.eventos_enviados)}</dd>
									</div>
									<div>
										<dt>Puntos obtenidos</dt>
										<dd>{formatearNumero(puntos)}</dd>
									</div>
									<div>
										<dt>Compañeros que completaron</dt>
										<dd>
											{completaron} de {fin.resultados.length}
										</dd>
									</div>
								</dl>
								{propio.estado === "completo" && puntos === 0 ? (
									<p className="rt-hint">
										Esta vez no sumaste puntos: los puntos de una actividad se otorgan una sola vez.
									</p>
								) : null}
							</>
						) : (
							<p className="rt-hint">No quedó registrada tu participación en esta actividad.</p>
						)}

						{recompensa ? (
							<>
								<PositiveMessage
									message={
										typeof recompensa.positive_message === "string"
											? recompensa.positive_message
											: recompensa.positive_message?.message
									}
								/>
								<ProgressionFeedback
									progreso={recompensa.progreso}
									retroalimentacion={recompensa.retroalimentacion}
								/>
							</>
						) : null}
					</section>
				)}

				{salida}
			</div>
		);
	}

	if (fin.tipo === "reemplazada") {
		return (
			<div className="final-results">
				<h1 className="final-results__title" tabIndex={-1} ref={tituloRef}>
					Entraste a la sala desde otro lugar
				</h1>
				<p className="rt-notice rt-notice--warning">
					Abriste esta misma sala desde otra pestaña o dispositivo, y esa conexión tomó tu lugar. Acá ya no
					recibís los cambios de la sala.
				</p>
				{errorRetomar ? (
					<p className="rt-notice rt-notice--error" role="alert">
						{errorRetomar}
					</p>
				) : null}
				<div className="rt-actions">
					<button type="button" className="rt-btn rt-btn--primary" onClick={onRetomar} disabled={retomando}>
						{retomando ? "Volviendo..." : "Volver a esta pestaña"}
					</button>
					{destinos.slice(0, 1).map((destino) => (
						<button
							key={destino.to}
							type="button"
							className="rt-btn rt-btn--secondary"
							onClick={() => onIr(destino.to)}
						>
							{destino.label}
						</button>
					))}
				</div>
			</div>
		);
	}

	if (fin.tipo === "no_encontrada") {
		return (
			<div className="final-results">
				<h1 className="final-results__title" tabIndex={-1} ref={tituloRef}>
					No encontramos esta sala
				</h1>
				<p className="rt-notice rt-notice--warning">
					Puede que la sala ya se haya cerrado, que el servidor se haya reiniciado o que no sea de tu grupo.
				</p>
				{salida}
			</div>
		);
	}

	return (
		<div className="final-results">
			<h1 className="final-results__title" tabIndex={-1} ref={tituloRef}>
				La sala se cerró
			</h1>
			<p className="rt-notice rt-notice--warning">{mensajeDeCierre(fin.motivo, rol)}</p>
			{salida}
		</div>
	);
}

export default FinalResults;
