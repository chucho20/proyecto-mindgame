import { useId, useState } from "react";

import "./PositiveMessageForm.css";

const CONTEXTO_LABELS = {
	reto_completado: "Reto completado",
	actividad_completada: "Actividad completada",
};

const CONTENIDO_MAX = 2000;
const CONTEXTO_MAX = 100;

/**
 * Formulario de alta/edición de mensajes positivos de convivencia. El estudiante
 * recibe uno al azar de los mensajes activos del contexto que corresponda
 * (`reto_completado`, `actividad_completada`), por eso `contextosConocidos`
 * (que devuelve la API) se ofrece como sugerencia: el campo sigue siendo libre.
 * `initialValues` es el mensaje tal como lo devuelve la API; `null` = alta.
 */
function PositiveMessageForm({
	initialValues = null,
	contextosConocidos = [],
	onSubmit,
	onCancel,
	submitting,
}) {
	const idPrefix = useId();
	const [form, setForm] = useState(() => ({
		contenido: initialValues?.contenido ?? "",
		contexto: initialValues?.contexto ?? "",
	}));
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");

	function updateField(field, value) {
		setForm((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({ ...current, [field]: "" }));
		setSubmitError("");
	}

	function validate() {
		const nextErrors = {};

		if (!form.contenido.trim()) {
			nextErrors.contenido = "El mensaje es obligatorio.";
		} else if (form.contenido.trim().length > CONTENIDO_MAX) {
			nextErrors.contenido = `El mensaje no puede superar los ${CONTENIDO_MAX} caracteres.`;
		}

		if (!form.contexto.trim()) {
			nextErrors.contexto = "El contexto es obligatorio.";
		} else if (form.contexto.trim().length > CONTEXTO_MAX) {
			nextErrors.contexto = `El contexto no puede superar los ${CONTEXTO_MAX} caracteres.`;
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSubmitError("");

		if (submitting || !validate()) {
			return;
		}

		try {
			await onSubmit({ contenido: form.contenido.trim(), contexto: form.contexto.trim() });
		} catch (error) {
			const details = error.response?.data?.details;
			setSubmitError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					error.response?.data?.message ||
					"No pudimos guardar el mensaje.",
			);
		}
	}

	return (
		<form className="positive-message-form" onSubmit={handleSubmit} noValidate>
			{submitError ? (
				<div className="positive-message-form__submit-error" role="alert">
					{submitError}
				</div>
			) : null}

			<div className="positive-message-form__field">
				<label htmlFor={`${idPrefix}-contenido`}>Mensaje</label>
				<textarea
					id={`${idPrefix}-contenido`}
					rows={4}
					maxLength={CONTENIDO_MAX}
					placeholder="Ej: ¡Excelente trabajo! Cada intento te hace más fuerte."
					value={form.contenido}
					onChange={(event) => updateField("contenido", event.target.value)}
					aria-invalid={Boolean(errors.contenido)}
					disabled={submitting}
				/>
				{errors.contenido ? <p className="positive-message-form__error">{errors.contenido}</p> : null}
			</div>

			<div className="positive-message-form__field">
				<label htmlFor={`${idPrefix}-contexto`}>Contexto</label>
				<input
					id={`${idPrefix}-contexto`}
					type="text"
					list={`${idPrefix}-contextos`}
					maxLength={CONTEXTO_MAX}
					placeholder="Ej: reto_completado"
					value={form.contexto}
					onChange={(event) => updateField("contexto", event.target.value)}
					aria-invalid={Boolean(errors.contexto)}
					disabled={submitting}
				/>
				<datalist id={`${idPrefix}-contextos`}>
					{contextosConocidos.map((contexto) => (
						<option key={contexto} value={contexto} />
					))}
				</datalist>
				<p className="positive-message-form__hint">
					Indica cuándo se muestra el mensaje. Elegí uno de los contextos que usa la plataforma o escribí uno
					propio.
				</p>
				{contextosConocidos.length > 0 ? (
					<div className="positive-message-form__suggestions">
						{contextosConocidos.map((contexto) => (
							<button
								key={contexto}
								type="button"
								className={
									form.contexto === contexto
										? "positive-message-form__chip positive-message-form__chip--active"
										: "positive-message-form__chip"
								}
								onClick={() => updateField("contexto", contexto)}
								disabled={submitting}
							>
								{CONTEXTO_LABELS[contexto] || contexto}
							</button>
						))}
					</div>
				) : null}
				{errors.contexto ? <p className="positive-message-form__error">{errors.contexto}</p> : null}
			</div>

			<div className="positive-message-form__actions">
				<button
					type="button"
					className="positive-message-form__cancel"
					onClick={onCancel}
					disabled={submitting}
				>
					Cancelar
				</button>
				<button type="submit" className="positive-message-form__submit" disabled={submitting}>
					{submitting ? "Guardando..." : "Guardar"}
				</button>
			</div>
		</form>
	);
}

export default PositiveMessageForm;
