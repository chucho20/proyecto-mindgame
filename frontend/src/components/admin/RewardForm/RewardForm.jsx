import { useEffect, useState } from "react";
import "./RewardForm.css";

const EMPTY_FORM = {
	nombre: "",
	descripcion: "",
	icono: "",
	tipoCondicion: "puntos",
	valorCondicion: "1",
};

function RewardForm({
	initialValues = null,
	onSubmit,
	onCancel,
	submitting = false,
}) {
	const [form, setForm] = useState(EMPTY_FORM);
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");

	useEffect(() => {
		if (initialValues) {
			setForm({
				nombre: initialValues.nombre ?? "",
				descripcion: initialValues.descripcion ?? "",
				icono: initialValues.icono ?? "",
				tipoCondicion: initialValues.tipoCondicion ?? "puntos",
				valorCondicion:
					initialValues.valorCondicion != null
						? String(initialValues.valorCondicion)
						: "1",
			});
		} else {
			setForm(EMPTY_FORM);
		}

		setErrors({});
		setSubmitError("");
	}, [initialValues]);

	function updateField(event) {
		const { name, value } = event.target;

		setForm((current) => ({
			...current,
			[name]: value,
		}));

		setErrors((current) => ({
			...current,
			[name]: "",
		}));

		setSubmitError("");
	}

	function validate() {
		const nextErrors = {};
		const nombre = form.nombre.trim();
		const descripcion = form.descripcion.trim();
		const icono = form.icono.trim();
		const valor = Number(form.valorCondicion);

		if (!nombre) {
			nextErrors.nombre = "El nombre es obligatorio.";
		}

		if (!descripcion) {
			nextErrors.descripcion = "La descripción es obligatoria.";
		}

		if (!icono) {
			nextErrors.icono = "El ícono es obligatorio.";
		}

		if (!["puntos", "nivel"].includes(form.tipoCondicion)) {
			nextErrors.tipoCondicion = "Selecciona un tipo de condición válido.";
		}

		if (
			form.valorCondicion.trim() === "" ||
			!Number.isFinite(valor) ||
			!Number.isInteger(valor) ||
			valor <= 0
		) {
			nextErrors.valorCondicion =
				"Introduce un número entero mayor que cero.";
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

		const payload = {
			nombre: form.nombre.trim(),
			descripcion: form.descripcion.trim(),
			icono: form.icono.trim(),
			tipoCondicion: form.tipoCondicion,
			valorCondicion: Number(form.valorCondicion),
		};

		try {
			await onSubmit(payload);
		} catch (error) {
			setSubmitError(
				error?.response?.data?.message ||
					error?.message ||
					"No se pudo guardar la recompensa. Inténtalo de nuevo.",
			);
		}
	}

	return (
		<form className="reward-form" onSubmit={handleSubmit} noValidate>
			<div className="reward-form__field">
				<label htmlFor="reward-nombre">Nombre *</label>
				<input
					id="reward-nombre"
					name="nombre"
					type="text"
					value={form.nombre}
					onChange={updateField}
					maxLength={100}
					placeholder="Ej. Explorador experto"
					aria-invalid={Boolean(errors.nombre)}
					aria-describedby={errors.nombre ? "reward-nombre-error" : undefined}
					disabled={submitting}
				/>
				{errors.nombre && (
					<p className="reward-form__error" id="reward-nombre-error">
						{errors.nombre}
					</p>
				)}
			</div>

			<div className="reward-form__field">
				<label htmlFor="reward-descripcion">Descripción *</label>
				<textarea
					id="reward-descripcion"
					name="descripcion"
					value={form.descripcion}
					onChange={updateField}
					rows={4}
					maxLength={500}
					placeholder="Describe cómo se obtiene esta recompensa."
					aria-invalid={Boolean(errors.descripcion)}
					aria-describedby={
						errors.descripcion ? "reward-descripcion-error" : undefined
					}
					disabled={submitting}
				/>
				{errors.descripcion && (
					<p className="reward-form__error" id="reward-descripcion-error">
						{errors.descripcion}
					</p>
				)}
			</div>

			<div className="reward-form__field">
				<label htmlFor="reward-icono">Ícono *</label>
				<input
					id="reward-icono"
					name="icono"
					type="text"
					value={form.icono}
					onChange={updateField}
					maxLength={100}
					placeholder="Ej. 🏆"
					aria-invalid={Boolean(errors.icono)}
					aria-describedby={errors.icono ? "reward-icono-error" : undefined}
					disabled={submitting}
				/>
				<p className="reward-form__hint">
					Puedes usar un emoji o el identificador de ícono que utilice tu proyecto.
				</p>
				{errors.icono && (
					<p className="reward-form__error" id="reward-icono-error">
						{errors.icono}
					</p>
				)}
			</div>

			<div className="reward-form__field">
				<label htmlFor="reward-tipo-condicion">Tipo de condición *</label>
				<select
					id="reward-tipo-condicion"
					name="tipoCondicion"
					value={form.tipoCondicion}
					onChange={updateField}
					aria-invalid={Boolean(errors.tipoCondicion)}
					disabled={submitting}
				>
					<option value="puntos">Puntos</option>
					<option value="nivel">Nivel</option>
				</select>
				{errors.tipoCondicion && (
					<p className="reward-form__error">{errors.tipoCondicion}</p>
				)}
			</div>

			<div className="reward-form__field">
				<label htmlFor="reward-valor-condicion">Valor de la condición *</label>
				<input
					id="reward-valor-condicion"
					name="valorCondicion"
					type="number"
					min="1"
					step="1"
					value={form.valorCondicion}
					onChange={updateField}
					aria-invalid={Boolean(errors.valorCondicion)}
					aria-describedby={
						errors.valorCondicion ? "reward-valor-error" : undefined
					}
					disabled={submitting}
				/>
				{errors.valorCondicion && (
					<p className="reward-form__error" id="reward-valor-error">
						{errors.valorCondicion}
					</p>
				)}
			</div>

			{submitError && (
				<p className="reward-form__submit-error" role="alert">
					{submitError}
				</p>
			)}

			<div className="reward-form__actions">
				<button
					type="button"
					className="reward-form__button reward-form__button--secondary"
					onClick={onCancel}
					disabled={submitting}
				>
					Cancelar
				</button>

				<button
					type="submit"
					className="reward-form__button reward-form__button--primary"
					disabled={submitting}
				>
					{submitting
						? "Guardando..."
						: initialValues
							? "Guardar cambios"
							: "Crear recompensa"}
				</button>
			</div>
		</form>
	);
}

export default RewardForm;
