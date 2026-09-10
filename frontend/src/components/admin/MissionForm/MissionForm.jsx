import { useState } from "react";

import "./MissionForm.css";

const EMPTY_FORM = { titulo: "", descripcion: "", orden: 0 };

/**
 * Formulario de creación/edición de misiones (RF-024). `initialValues` viene
 * poblado cuando se edita una misión existente; `null`/`undefined` = alta.
 */
function MissionForm({ initialValues, onSubmit, onCancel, submitting }) {
	const [form, setForm] = useState({
		titulo: initialValues?.titulo || EMPTY_FORM.titulo,
		descripcion: initialValues?.descripcion || EMPTY_FORM.descripcion,
		orden: initialValues?.orden ?? EMPTY_FORM.orden,
	});
	const [error, setError] = useState("");

	function updateField(field, value) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");

		try {
			await onSubmit({ ...form, orden: Number(form.orden) || 0 });
		} catch (err) {
			const details = err.response?.data?.details;
			setError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					err.response?.data?.message ||
					"No pudimos guardar la misión.",
			);
		}
	}

	return (
		<form className="mission-form" onSubmit={handleSubmit}>
			{error ? <div className="mission-form__error">{error}</div> : null}

			<div className="mission-form__field">
				<label htmlFor="mission-titulo">Título</label>
				<input
					id="mission-titulo"
					type="text"
					value={form.titulo}
					onChange={(event) => updateField("titulo", event.target.value)}
					required
				/>
			</div>

			<div className="mission-form__field">
				<label htmlFor="mission-descripcion">Descripción</label>
				<textarea
					id="mission-descripcion"
					rows={3}
					value={form.descripcion}
					onChange={(event) => updateField("descripcion", event.target.value)}
				/>
			</div>

			<div className="mission-form__field">
				<label htmlFor="mission-orden">Orden</label>
				<input
					id="mission-orden"
					type="number"
					value={form.orden}
					onChange={(event) => updateField("orden", event.target.value)}
				/>
			</div>

			<div className="mission-form__actions">
				<button type="button" className="mission-form__cancel" onClick={onCancel} disabled={submitting}>
					Cancelar
				</button>
				<button type="submit" className="mission-form__submit" disabled={submitting}>
					{submitting ? "Guardando..." : "Guardar"}
				</button>
			</div>
		</form>
	);
}

export default MissionForm;
