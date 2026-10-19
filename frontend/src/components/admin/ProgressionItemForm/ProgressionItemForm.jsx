import { useId, useState } from "react";

import "./ProgressionItemForm.css";

const TIPOS_CONDICION = [
	{ value: "puntos", label: "Puntos totales" },
	{ value: "nivel", label: "Nivel alcanzado" },
];

const EMPTY_FORM = {
	nombre: "",
	descripcion: "",
	icono: "",
	condicionTipo: "puntos",
	condicionValor: "1",
};

/**
 * La API devuelve snake_case (`condicion_tipo`, `condicion_valor`): acá se
 * traduce a los campos del formulario. Sin `initialValues` (alta) usa los valores vacíos.
 */
function toFormValues(initialValues) {
	if (!initialValues) {
		return EMPTY_FORM;
	}

	return {
		nombre: initialValues.nombre ?? "",
		descripcion: initialValues.descripcion ?? "",
		icono: initialValues.icono ?? "",
		condicionTipo: initialValues.condicion_tipo ?? EMPTY_FORM.condicionTipo,
		condicionValor: initialValues.condicion_valor != null ? String(initialValues.condicion_valor) : "0",
	};
}

/**
 * Formulario compartido por recompensas y logros (misma forma en la API:
 * nombre, descripción, ícono y una condición `puntos`/`nivel` + valor).
 * `initialValues` es el ítem tal como lo devuelve la API (snake_case) al editar;
 * `null` = alta. El formulario se monta de cero cada vez que se abre el panel,
 * por eso alcanza con inicializar el estado una sola vez.
 *
 * `labels`: textos propios de cada entidad (placeholders y mensajes).
 */
function ProgressionItemForm({ initialValues = null, labels, onSubmit, onCancel, submitting = false }) {
	const idPrefix = useId();
	const [form, setForm] = useState(() => toFormValues(initialValues));
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");

	function updateField(event) {
		const { name, value } = event.target;

		setForm((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: "" }));
		setSubmitError("");
	}

	function validate() {
		const nextErrors = {};
		const valor = Number(form.condicionValor);

		if (!form.nombre.trim()) {
			nextErrors.nombre = "El nombre es obligatorio.";
		}

		if (!form.descripcion.trim()) {
			nextErrors.descripcion = "La descripción es obligatoria.";
		}

		if (!form.icono.trim()) {
			nextErrors.icono = "El ícono es obligatorio.";
		}

		if (!TIPOS_CONDICION.some((tipo) => tipo.value === form.condicionTipo)) {
			nextErrors.condicionTipo = "Elegí un tipo de condición válido.";
		}

		if (form.condicionValor.trim() === "" || !Number.isInteger(valor) || valor < 0) {
			nextErrors.condicionValor = "Ingresá un número entero mayor o igual a 0.";
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
			await onSubmit({
				nombre: form.nombre.trim(),
				descripcion: form.descripcion.trim(),
				icono: form.icono.trim(),
				condicion_tipo: form.condicionTipo,
				condicion_valor: Number(form.condicionValor),
			});
		} catch (error) {
			const details = error.response?.data?.details;
			setSubmitError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					error.response?.data?.message ||
					labels.saveError,
			);
		}
	}

	return (
		<form className="progression-form" onSubmit={handleSubmit} noValidate>
			{submitError ? (
				<div className="progression-form__submit-error" role="alert">
					{submitError}
				</div>
			) : null}

			<div className="progression-form__field">
				<label htmlFor={`${idPrefix}-nombre`}>Nombre</label>
				<input
					id={`${idPrefix}-nombre`}
					name="nombre"
					type="text"
					value={form.nombre}
					onChange={updateField}
					maxLength={150}
					placeholder={labels.nombrePlaceholder}
					aria-invalid={Boolean(errors.nombre)}
					disabled={submitting}
				/>
				{errors.nombre ? <p className="progression-form__error">{errors.nombre}</p> : null}
			</div>

			<div className="progression-form__field">
				<label htmlFor={`${idPrefix}-descripcion`}>Descripción</label>
				<textarea
					id={`${idPrefix}-descripcion`}
					name="descripcion"
					value={form.descripcion}
					onChange={updateField}
					rows={3}
					maxLength={2000}
					placeholder={labels.descripcionPlaceholder}
					aria-invalid={Boolean(errors.descripcion)}
					disabled={submitting}
				/>
				{errors.descripcion ? <p className="progression-form__error">{errors.descripcion}</p> : null}
			</div>

			<div className="progression-form__field">
				<label htmlFor={`${idPrefix}-icono`}>Ícono</label>
				<input
					id={`${idPrefix}-icono`}
					name="icono"
					type="text"
					value={form.icono}
					onChange={updateField}
					maxLength={100}
					placeholder="Ej: 🏆"
					aria-invalid={Boolean(errors.icono)}
					disabled={submitting}
				/>
				<p className="progression-form__hint">Escribí un emoji: es lo que ve el estudiante en la tarjeta.</p>
				{errors.icono ? <p className="progression-form__error">{errors.icono}</p> : null}
			</div>

			<div className="progression-form__row">
				<div className="progression-form__field">
					<label htmlFor={`${idPrefix}-tipo`}>Tipo de condición</label>
					<select
						id={`${idPrefix}-tipo`}
						name="condicionTipo"
						value={form.condicionTipo}
						onChange={updateField}
						aria-invalid={Boolean(errors.condicionTipo)}
						disabled={submitting}
					>
						{TIPOS_CONDICION.map((tipo) => (
							<option key={tipo.value} value={tipo.value}>
								{tipo.label}
							</option>
						))}
					</select>
					{errors.condicionTipo ? <p className="progression-form__error">{errors.condicionTipo}</p> : null}
				</div>

				<div className="progression-form__field">
					<label htmlFor={`${idPrefix}-valor`}>Valor requerido</label>
					<input
						id={`${idPrefix}-valor`}
						name="condicionValor"
						type="number"
						min="0"
						step="1"
						value={form.condicionValor}
						onChange={updateField}
						aria-invalid={Boolean(errors.condicionValor)}
						disabled={submitting}
					/>
					{errors.condicionValor ? <p className="progression-form__error">{errors.condicionValor}</p> : null}
				</div>
			</div>

			<div className="progression-form__actions">
				<button type="button" className="progression-form__cancel" onClick={onCancel} disabled={submitting}>
					Cancelar
				</button>
				<button type="submit" className="progression-form__submit" disabled={submitting}>
					{submitting ? "Guardando..." : "Guardar"}
				</button>
			</div>
		</form>
	);
}

export default ProgressionItemForm;
