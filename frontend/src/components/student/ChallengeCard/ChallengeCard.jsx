import { useState } from "react";

import "./ChallengeCard.css";

const TIPO_LABEL = {
	seleccion_multiple: "Selección múltiple",
	verdadero_falso: "Verdadero o falso",
	relacion_elementos: "Relación de elementos",
	orden_cronologico: "Orden cronológico",
};

function moveItem(list, index, direction) {
	const newIndex = index + direction;
	if (newIndex < 0 || newIndex >= list.length) {
		return list;
	}
	const copy = [...list];
	[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
	return copy;
}

/**
 * El admin suele cargar los eventos de orden_cronologico ya en el orden
 * correcto (es lo natural al redactar el reto). El backend nunca manda
 * `respuesta_correcta` al estudiante, pero si mostráramos `opciones` en el
 * mismo orden en que las cargó el admin, el orden inicial coincidiría con
 * la respuesta correcta y bastaría con tocar "Responder" sin reordenar nada.
 * Barajamos acá, del lado del cliente, para que el ejercicio sea real.
 */
function mezclar(lista) {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

/**
 * Tarjeta de reto (RF-010): renderiza la interacción correcta según
 * `reto.tipo` y envía la respuesta al backend, que la evalúa con el
 * evaluador Strategy correspondiente. Este componente NO evalúa nada del
 * lado del cliente — solo arma la forma de `respuesta` que cada tipo espera
 * y muestra el resultado que devuelve la API.
 */
function ChallengeCard({ reto, onResponder }) {
	const [seleccion, setSeleccion] = useState("");
	const [verdaderoFalso, setVerdaderoFalso] = useState(null);
	const [relaciones, setRelaciones] = useState({});
	const [orden, setOrden] = useState(() =>
		mezclar((Array.isArray(reto.opciones) ? reto.opciones : []).map((item) => item.id)),
	);
	const [resultado, setResultado] = useState(null);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState("");

	async function enviarRespuesta(respuesta) {
		setError("");
		setEnviando(true);
		try {
			const { resultado: resultadoRespuesta } = await onResponder(reto.id, respuesta);
			setResultado(resultadoRespuesta);
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos evaluar tu respuesta.");
		} finally {
			setEnviando(false);
		}
	}

	function renderInteraccion() {
		if (reto.tipo === "seleccion_multiple") {
			return (
				<div className="challenge-card__options">
					{(reto.opciones || []).map((opcion) => (
						<label
							key={opcion.id}
							className={
								seleccion === opcion.id
									? "challenge-card__option challenge-card__option--active"
									: "challenge-card__option"
							}
						>
							<input
								type="radio"
								name={`reto-${reto.id}`}
								value={opcion.id}
								checked={seleccion === opcion.id}
								onChange={() => setSeleccion(opcion.id)}
							/>
							{opcion.texto}
						</label>
					))}
					<button
						type="button"
						className="challenge-card__submit"
						disabled={!seleccion || enviando}
						onClick={() => enviarRespuesta(seleccion)}
					>
						{enviando ? "Enviando..." : "Responder"}
					</button>
				</div>
			);
		}

		if (reto.tipo === "verdadero_falso") {
			return (
				<div className="challenge-card__options">
					<div className="challenge-card__vf-row">
						<label
							className={
								verdaderoFalso === true
									? "challenge-card__option challenge-card__option--active"
									: "challenge-card__option"
							}
						>
							<input
								type="radio"
								name={`reto-${reto.id}`}
								checked={verdaderoFalso === true}
								onChange={() => setVerdaderoFalso(true)}
							/>
							Verdadero
						</label>
						<label
							className={
								verdaderoFalso === false
									? "challenge-card__option challenge-card__option--active"
									: "challenge-card__option"
							}
						>
							<input
								type="radio"
								name={`reto-${reto.id}`}
								checked={verdaderoFalso === false}
								onChange={() => setVerdaderoFalso(false)}
							/>
							Falso
						</label>
					</div>
					<button
						type="button"
						className="challenge-card__submit"
						disabled={verdaderoFalso === null || enviando}
						onClick={() => enviarRespuesta(verdaderoFalso)}
					>
						{enviando ? "Enviando..." : "Responder"}
					</button>
				</div>
			);
		}

		if (reto.tipo === "relacion_elementos") {
			const izquierda = reto.opciones?.izquierda || [];
			const derecha = reto.opciones?.derecha || [];
			const completo = izquierda.every((item) => relaciones[item.id]);

			return (
				<div className="challenge-card__options">
					{izquierda.map((item) => (
						<div key={item.id} className="challenge-card__match-row">
							<span className="challenge-card__match-label">{item.texto}</span>
							<select
								value={relaciones[item.id] || ""}
								onChange={(event) => setRelaciones((prev) => ({ ...prev, [item.id]: event.target.value }))}
							>
								<option value="" disabled>
									Elegí una opción
								</option>
								{derecha.map((opcion) => (
									<option key={opcion.id} value={opcion.id}>
										{opcion.texto}
									</option>
								))}
							</select>
						</div>
					))}
					<button
						type="button"
						className="challenge-card__submit"
						disabled={!completo || enviando}
						onClick={() => enviarRespuesta(relaciones)}
					>
						{enviando ? "Enviando..." : "Responder"}
					</button>
				</div>
			);
		}

		if (reto.tipo === "orden_cronologico") {
			const opcionesPorId = new Map((reto.opciones || []).map((item) => [item.id, item.texto]));

			return (
				<div className="challenge-card__options">
					<ol className="challenge-card__order-list">
						{orden.map((id, index) => (
							<li key={id} className="challenge-card__order-item">
								<span>{opcionesPorId.get(id) || id}</span>
								<span className="challenge-card__order-controls">
									<button
										type="button"
										aria-label="Subir"
										disabled={index === 0}
										onClick={() => setOrden((prev) => moveItem(prev, index, -1))}
									>
										↑
									</button>
									<button
										type="button"
										aria-label="Bajar"
										disabled={index === orden.length - 1}
										onClick={() => setOrden((prev) => moveItem(prev, index, 1))}
									>
										↓
									</button>
								</span>
							</li>
						))}
					</ol>
					<button
						type="button"
						className="challenge-card__submit"
						disabled={enviando}
						onClick={() => enviarRespuesta(orden)}
					>
						{enviando ? "Enviando..." : "Responder"}
					</button>
				</div>
			);
		}

		return <p className="challenge-card__unknown">Este tipo de reto todavía no tiene interacción.</p>;
	}

	return (
		<div className="challenge-card">
			<span className="challenge-card__type">{TIPO_LABEL[reto.tipo] || reto.tipo}</span>
			<p className="challenge-card__enunciado">{reto.enunciado}</p>

			{renderInteraccion()}

			{error ? <p className="challenge-card__error">{error}</p> : null}

			{resultado ? (
				<p
					className={
						resultado.esCorrecto
							? "challenge-card__result challenge-card__result--ok"
							: "challenge-card__result challenge-card__result--fail"
					}
				>
					{resultado.esCorrecto
						? `¡Correcto! Sumaste ${resultado.puntosObtenidos} puntos.`
						: "No es correcto todavía, ¡probá de nuevo!"}
				</p>
			) : null}
		</div>
	);
}

export default ChallengeCard;
