import { useId, useState } from "react";

import { CONTEXTOS_POR_DEFECTO, etiquetaContexto } from "../../../utils/convivencia.js";
import "./PositiveMessageForm.css";

const CONTENIDO_MAX = 2000;

/**
 * Formulario de alta/edición de mensajes positivos de convivencia. El estudiante
 * recibe uno al azar de los mensajes activos del contexto que corresponde
 * (`reto_completado`, `actividad_completada`), y el backend rechaza cualquier otro
 * contexto: por eso es un select de `contextosConocidos` (lo que devuelve la API;
 * si no llega, los dos contextos que usa la plataforma).
 * `initialValues` es el mensaje tal como lo devuelve la API; `null` = alta. Un
 * mensaje viejo con un contexto desconocido se muestra como opción deshabilitada con
 * una advertencia: nunca se le muestra a un estudiante y hay que cambiarlo para guardar.
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

	const contextos = contextosConocidos.length > 0 ? contextosConocidos : CONTEXTOS_POR_DEFECTO;
	const contextoLegacy =
		initialValues?.contexto && !contextos.includes(initialValues.contexto) ? initialValues.contexto : null;
	const contextoDescribedBy = [
		`${idPrefix}-contexto-hint`,
		contextoLegacy ? `${idPrefix}-contexto-legacy` : null,
		errors.contexto ? `${idPrefix}-contexto-error` : null,
	]
		.filter(Boolean)
		.join(" ");

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

		if (!form.contexto) {
			nextErrors.contexto = "El contexto es obligatorio.";
		} else if (!contextos.includes(form.contexto)) {
			nextErrors.contexto = "Elegí uno de los contextos de la lista.";
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
			await onSubmit({ contenido: form.contenido.trim(), contexto: form.contexto });
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

			<p className="positive-message-form__legend">
				<span aria-hidden="true">*</span> Campo obligatorio
			</p>

			<div className="positive-message-form__field">
				<label htmlFor={`${idPrefix}-contenido`}>
					Mensaje <span aria-hidden="true">*</span>
				</label>
				<textarea
					id={`${idPrefix}-contenido`}
					rows={4}
					maxLength={CONTENIDO_MAX}
					placeholder="Ej: ¡Excelente trabajo! Cada intento te hace más fuerte."
					value={form.contenido}
					onChange={(event) => updateField("contenido", event.target.value)}
					aria-required="true"
					aria-invalid={Boolean(errors.contenido)}
					aria-describedby={errors.contenido ? `${idPrefix}-contenido-error` : undefined}
					disabled={submitting}
				/>
				{errors.contenido ? (
					<p id={`${idPrefix}-contenido-error`} className="positive-message-form__error">
						{errors.contenido}
					</p>
				) : null}
			</div>

			<div className="positive-message-form__field">
				<label htmlFor={`${idPrefix}-contexto`}>
					Contexto <span aria-hidden="true">*</span>
				</label>
				<select
					id={`${idPrefix}-contexto`}
					value={form.contexto}
					onChange={(event) => updateField("contexto", event.target.value)}
					aria-required="true"
					aria-invalid={Boolean(errors.contexto)}
					aria-describedby={contextoDescribedBy}
					disabled={submitting}
				>
					<option value="" disabled>
						Elegí un contexto
					</option>
					{contextoLegacy ? (
						<option value={contextoLegacy} disabled>
							{contextoLegacy} (no se muestra)
						</option>
					) : null}
					{contextos.map((contexto) => (
						<option key={contexto} value={contexto}>
							{etiquetaContexto(contexto)}
						</option>
					))}
				</select>
				<p id={`${idPrefix}-contexto-hint`} className="positive-message-form__hint">
					Indica cuándo se muestra el mensaje: al responder bien un reto o al completar una actividad.
				</p>
				{contextoLegacy ? (
					<p id={`${idPrefix}-contexto-legacy`} className="positive-message-form__warning">
						El contexto actual («{contextoLegacy}») no existe en la plataforma, así que este mensaje nunca se
						le muestra a un estudiante. Elegí uno de la lista para poder guardarlo.
					</p>
				) : null}
				{errors.contexto ? (
					<p id={`${idPrefix}-contexto-error`} className="positive-message-form__error">
						{errors.contexto}
					</p>
				) : null}
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
