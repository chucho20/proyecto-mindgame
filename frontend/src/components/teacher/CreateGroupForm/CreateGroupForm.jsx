import { useId, useState } from "react";

import { mensajeDeError } from "../../../utils/estadisticas.js";
import "./CreateGroupForm.css";

const LONGITUD_MAXIMA_NOMBRE = 100;

/**
 * Formulario de alta de un grupo (RF-022): solo pide el nombre. El código lo
 * genera el backend. `onSubmit` recibe `{ nombre }` y puede rechazar: el error
 * se muestra arriba del formulario y el panel sigue abierto. El formulario se
 * monta de cero cada vez que se abre el panel, por eso alcanza con inicializar
 * el estado una sola vez.
 */
function CreateGroupForm({ onSubmit, onCancel, submitting = false }) {
	const idPrefix = useId();
	const [nombre, setNombre] = useState("");
	const [error, setError] = useState("");
	const [submitError, setSubmitError] = useState("");

	function handleChange(event) {
		setNombre(event.target.value);
		setError("");
		setSubmitError("");
	}

	function validate() {
		const limpio = nombre.trim();

		if (!limpio) {
			setError("El nombre del grupo es obligatorio.");
			return false;
		}

		if (limpio.length > LONGITUD_MAXIMA_NOMBRE) {
			setError(`El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`);
			return false;
		}

		return true;
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSubmitError("");

		if (submitting || !validate()) {
			return;
		}

		try {
			await onSubmit({ nombre: nombre.trim() });
		} catch (err) {
			setSubmitError(mensajeDeError(err, "No pudimos crear el grupo."));
		}
	}

	return (
		<form className="create-group-form" onSubmit={handleSubmit} noValidate>
			{submitError ? (
				<div className="create-group-form__submit-error" role="alert">
					{submitError}
				</div>
			) : null}

			<p className="create-group-form__legend">
				<span aria-hidden="true">*</span> Campo obligatorio
			</p>

			<div className="create-group-form__field">
				<label htmlFor={`${idPrefix}-nombre`}>
					Nombre del grupo <span aria-hidden="true">*</span>
				</label>
				<input
					id={`${idPrefix}-nombre`}
					name="nombre"
					type="text"
					value={nombre}
					onChange={handleChange}
					maxLength={LONGITUD_MAXIMA_NOMBRE}
					placeholder="Ej: Grado 6°A"
					autoComplete="off"
					aria-required="true"
					aria-invalid={Boolean(error)}
					aria-describedby={error ? `${idPrefix}-nombre-error` : `${idPrefix}-nombre-hint`}
					disabled={submitting}
				/>
				<p id={`${idPrefix}-nombre-hint`} className="create-group-form__hint">
					Al crearlo generamos un código para que tus estudiantes se unan.
				</p>
				{error ? (
					<p id={`${idPrefix}-nombre-error`} className="create-group-form__error">
						{error}
					</p>
				) : null}
			</div>

			<div className="create-group-form__actions">
				<button type="button" className="create-group-form__cancel" onClick={onCancel} disabled={submitting}>
					Cancelar
				</button>
				<button type="submit" className="create-group-form__submit" disabled={submitting}>
					{submitting ? "Creando..." : "Crear grupo"}
				</button>
			</div>
		</form>
	);
}

export default CreateGroupForm;
