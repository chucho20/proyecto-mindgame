import { useState } from "react";

import "./ChallengeForm.css";

const TIPOS = [
	{ value: "seleccion_multiple", label: "Selección múltiple" },
	{ value: "verdadero_falso", label: "Verdadero o falso" },
	{ value: "relacion_elementos", label: "Relación de elementos" },
	{ value: "orden_cronologico", label: "Orden cronológico" },
];

function nuevoId() {
	return Math.random().toString(36).slice(2, 8);
}

function filaVacia() {
	return { id: nuevoId(), texto: "" };
}

/**
 * Formulario de creación/edición de retos (RF-010/RF-024). Es el más
 * complejo de los tres: la forma de `opciones`/`respuestaCorrecta` cambia
 * según `tipo` (mismo contrato que consumen los evaluadores Strategy del
 * backend — ver backend/src/services/evaluadores/).
 */
function ChallengeForm({ initialValues, misiones, onSubmit, onCancel, submitting }) {
	const tipoInicial = initialValues?.tipo || "seleccion_multiple";

	const [misionId, setMisionId] = useState(initialValues?.mision_id || misiones?.[0]?.id || "");
	const [tipo, setTipo] = useState(tipoInicial);
	const [enunciado, setEnunciado] = useState(initialValues?.enunciado || "");
	const [puntos, setPuntos] = useState(initialValues?.puntos ?? 10);
	const [orden, setOrden] = useState(initialValues?.orden ?? 0);
	const [error, setError] = useState("");

	// seleccion_multiple
	const [opcionesSM, setOpcionesSM] = useState(() =>
		tipoInicial === "seleccion_multiple" && initialValues?.opciones?.length
			? initialValues.opciones
			: [filaVacia(), filaVacia()],
	);
	const [correctaSM, setCorrectaSM] = useState(
		tipoInicial === "seleccion_multiple" ? initialValues?.respuesta_correcta || "" : "",
	);

	// verdadero_falso
	const [correctaVF, setCorrectaVF] = useState(
		tipoInicial === "verdadero_falso" ? Boolean(initialValues?.respuesta_correcta) : true,
	);

	// relacion_elementos
	const [izquierda, setIzquierda] = useState(() =>
		tipoInicial === "relacion_elementos" && initialValues?.opciones?.izquierda?.length
			? initialValues.opciones.izquierda
			: [filaVacia(), filaVacia()],
	);
	const [derecha, setDerecha] = useState(() =>
		tipoInicial === "relacion_elementos" && initialValues?.opciones?.derecha?.length
			? initialValues.opciones.derecha
			: [filaVacia(), filaVacia()],
	);
	const [mapeo, setMapeo] = useState(
		tipoInicial === "relacion_elementos" ? initialValues?.respuesta_correcta || {} : {},
	);

	// orden_cronologico
	const [eventos, setEventos] = useState(() =>
		tipoInicial === "orden_cronologico" && initialValues?.opciones?.length
			? initialValues.opciones
			: [filaVacia(), filaVacia()],
	);

	function moverEvento(index, direction) {
		setEventos((prev) => {
			const newIndex = index + direction;
			if (newIndex < 0 || newIndex >= prev.length) {
				return prev;
			}
			const copy = [...prev];
			[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
			return copy;
		});
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");

		let opciones = null;
		let respuestaCorrecta;

		if (tipo === "seleccion_multiple") {
			const validas = opcionesSM.filter((opcion) => opcion.texto.trim());
			if (validas.length < 2) {
				setError("Cargá al menos 2 opciones.");
				return;
			}
			if (!correctaSM || !validas.some((opcion) => opcion.id === correctaSM)) {
				setError("Marcá cuál opción es la correcta.");
				return;
			}
			opciones = validas;
			respuestaCorrecta = correctaSM;
		} else if (tipo === "verdadero_falso") {
			opciones = null;
			respuestaCorrecta = correctaVF;
		} else if (tipo === "relacion_elementos") {
			const izq = izquierda.filter((item) => item.texto.trim());
			const der = derecha.filter((item) => item.texto.trim());
			if (izq.length < 2 || der.length < 2) {
				setError("Cargá al menos 2 elementos en cada columna.");
				return;
			}
			const mapeoFinal = {};
			izq.forEach((item) => {
				if (mapeo[item.id]) {
					mapeoFinal[item.id] = mapeo[item.id];
				}
			});
			if (Object.keys(mapeoFinal).length !== izq.length) {
				setError("Asigná la pareja correcta para cada elemento de la izquierda.");
				return;
			}
			opciones = { izquierda: izq, derecha: der };
			respuestaCorrecta = mapeoFinal;
		} else if (tipo === "orden_cronologico") {
			const items = eventos.filter((item) => item.texto.trim());
			if (items.length < 2) {
				setError("Cargá al menos 2 eventos.");
				return;
			}
			opciones = items;
			respuestaCorrecta = items.map((item) => item.id);
		}

		try {
			await onSubmit({
				misionId: Number(misionId),
				tipo,
				enunciado,
				opciones,
				respuestaCorrecta,
				puntos: Number(puntos) || 0,
				orden: Number(orden) || 0,
			});
		} catch (err) {
			const details = err.response?.data?.details;
			setError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					err.response?.data?.message ||
					"No pudimos guardar el reto.",
			);
		}
	}

	return (
		<form className="challenge-form" onSubmit={handleSubmit}>
			{error ? <div className="challenge-form__error">{error}</div> : null}

			<div className="challenge-form__row">
				<div className="challenge-form__field">
					<label htmlFor="challenge-mision">Misión</label>
					<select
						id="challenge-mision"
						value={misionId}
						onChange={(event) => setMisionId(event.target.value)}
						required
					>
						<option value="" disabled>
							Elegí una misión
						</option>
						{(misiones || []).map((mision) => (
							<option key={mision.id} value={mision.id}>
								{mision.titulo}
							</option>
						))}
					</select>
				</div>

				<div className="challenge-form__field">
					<label htmlFor="challenge-tipo">Tipo</label>
					<select id="challenge-tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
						{TIPOS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="challenge-form__field">
				<label htmlFor="challenge-enunciado">Enunciado</label>
				<textarea
					id="challenge-enunciado"
					rows={2}
					value={enunciado}
					onChange={(event) => setEnunciado(event.target.value)}
					required
				/>
			</div>

			{tipo === "seleccion_multiple" ? (
				<div className="challenge-form__builder">
					<p className="challenge-form__builder-title">Opciones (marcá cuál es la correcta)</p>
					{opcionesSM.map((opcion, index) => (
						<div key={opcion.id} className="challenge-form__option-row">
							<input
								type="radio"
								name="correcta-sm"
								checked={correctaSM === opcion.id}
								onChange={() => setCorrectaSM(opcion.id)}
							/>
							<input
								type="text"
								placeholder={`Opción ${index + 1}`}
								value={opcion.texto}
								onChange={(event) =>
									setOpcionesSM((prev) =>
										prev.map((item) =>
											item.id === opcion.id ? { ...item, texto: event.target.value } : item,
										),
									)
								}
							/>
							<button
								type="button"
								onClick={() => setOpcionesSM((prev) => prev.filter((item) => item.id !== opcion.id))}
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						className="challenge-form__add"
						onClick={() => setOpcionesSM((prev) => [...prev, filaVacia()])}
					>
						+ Agregar opción
					</button>
				</div>
			) : null}

			{tipo === "verdadero_falso" ? (
				<div className="challenge-form__builder">
					<p className="challenge-form__builder-title">Respuesta correcta</p>
					<div className="challenge-form__vf-row">
						<label>
							<input type="radio" checked={correctaVF === true} onChange={() => setCorrectaVF(true)} />{" "}
							Verdadero
						</label>
						<label>
							<input type="radio" checked={correctaVF === false} onChange={() => setCorrectaVF(false)} />{" "}
							Falso
						</label>
					</div>
				</div>
			) : null}

			{tipo === "relacion_elementos" ? (
				<div className="challenge-form__builder">
					<p className="challenge-form__builder-title">Columna izquierda</p>
					{izquierda.map((item, index) => (
						<div key={item.id} className="challenge-form__option-row">
							<input
								type="text"
								placeholder={`Elemento ${index + 1}`}
								value={item.texto}
								onChange={(event) =>
									setIzquierda((prev) =>
										prev.map((row) => (row.id === item.id ? { ...row, texto: event.target.value } : row)),
									)
								}
							/>
							<button
								type="button"
								onClick={() => setIzquierda((prev) => prev.filter((row) => row.id !== item.id))}
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						className="challenge-form__add"
						onClick={() => setIzquierda((prev) => [...prev, filaVacia()])}
					>
						+ Agregar elemento
					</button>

					<p className="challenge-form__builder-title">Columna derecha</p>
					{derecha.map((item, index) => (
						<div key={item.id} className="challenge-form__option-row">
							<input
								type="text"
								placeholder={`Pareja ${index + 1}`}
								value={item.texto}
								onChange={(event) =>
									setDerecha((prev) =>
										prev.map((row) => (row.id === item.id ? { ...row, texto: event.target.value } : row)),
									)
								}
							/>
							<button
								type="button"
								onClick={() => setDerecha((prev) => prev.filter((row) => row.id !== item.id))}
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						className="challenge-form__add"
						onClick={() => setDerecha((prev) => [...prev, filaVacia()])}
					>
						+ Agregar pareja
					</button>

					<p className="challenge-form__builder-title">Asignar pareja correcta</p>
					{izquierda
						.filter((item) => item.texto.trim())
						.map((item) => (
							<div key={item.id} className="challenge-form__match-row">
								<span>{item.texto}</span>
								<select
									value={mapeo[item.id] || ""}
									onChange={(event) => setMapeo((prev) => ({ ...prev, [item.id]: event.target.value }))}
								>
									<option value="" disabled>
										Elegí una pareja
									</option>
									{derecha
										.filter((row) => row.texto.trim())
										.map((row) => (
											<option key={row.id} value={row.id}>
												{row.texto}
											</option>
										))}
								</select>
							</div>
						))}
				</div>
			) : null}

			{tipo === "orden_cronologico" ? (
				<div className="challenge-form__builder">
					<p className="challenge-form__builder-title">Eventos, en el orden correcto</p>
					{eventos.map((evento, index) => (
						<div key={evento.id} className="challenge-form__option-row">
							<span className="challenge-form__order-index">{index + 1}</span>
							<input
								type="text"
								placeholder={`Evento ${index + 1}`}
								value={evento.texto}
								onChange={(event) =>
									setEventos((prev) =>
										prev.map((row) => (row.id === evento.id ? { ...row, texto: event.target.value } : row)),
									)
								}
							/>
							<button type="button" disabled={index === 0} onClick={() => moverEvento(index, -1)}>
								↑
							</button>
							<button
								type="button"
								disabled={index === eventos.length - 1}
								onClick={() => moverEvento(index, 1)}
							>
								↓
							</button>
							<button
								type="button"
								onClick={() => setEventos((prev) => prev.filter((row) => row.id !== evento.id))}
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						className="challenge-form__add"
						onClick={() => setEventos((prev) => [...prev, filaVacia()])}
					>
						+ Agregar evento
					</button>
				</div>
			) : null}

			<div className="challenge-form__row">
				<div className="challenge-form__field">
					<label htmlFor="challenge-puntos">Puntos</label>
					<input
						id="challenge-puntos"
						type="number"
						value={puntos}
						onChange={(event) => setPuntos(event.target.value)}
					/>
				</div>
				<div className="challenge-form__field">
					<label htmlFor="challenge-orden">Orden</label>
					<input
						id="challenge-orden"
						type="number"
						value={orden}
						onChange={(event) => setOrden(event.target.value)}
					/>
				</div>
			</div>

			<div className="challenge-form__actions">
				<button type="button" className="challenge-form__cancel" onClick={onCancel} disabled={submitting}>
					Cancelar
				</button>
				<button type="submit" className="challenge-form__submit" disabled={submitting}>
					{submitting ? "Guardando..." : "Guardar"}
				</button>
			</div>
		</form>
	);
}

export default ChallengeForm;
