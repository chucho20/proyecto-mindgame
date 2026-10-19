import { useState } from "react";

import "./ActivityForm.css";

/**
 * Formulario de creación/edición de actividades recreativas (RF-025).
 * `misiones`: lista para el selector (misión dueña de la actividad).
 */
function ActivityForm({ initialValues, misiones, onSubmit, onCancel, submitting }) {
	const [form, setForm] = useState({
		misionId: initialValues?.mision_id || misiones?.[0]?.id || "",
		titulo: initialValues?.titulo || "",
		descripcion: initialValues?.descripcion || "",
		tipo: initialValues?.tipo || "",
		orden: initialValues?.orden ?? 0,
		puntos: initialValues?.puntos ?? 0,
		retroalimentacion: initialValues?.retroalimentacion || "",
	});
	const [error, setError] = useState("");

	function updateField(field, value) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");

		try {
			await onSubmit({
				...form,
				misionId: Number(form.misionId),
				orden: Number(form.orden) || 0,
				puntos: Number(form.puntos) || 0,
				retroalimentacion: form.retroalimentacion.trim(),
			});
		} catch (err) {
			const details = err.response?.data?.details;
			setError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					err.response?.data?.message ||
					"No pudimos guardar la actividad.",
			);
		}
	}

	return (
		<form className="activity-form" onSubmit={handleSubmit}>
			{error ? <div className="activity-form__error">{error}</div> : null}

			<div className="activity-form__field">
				<label htmlFor="activity-mision">Misión</label>
				<select
					id="activity-mision"
					value={form.misionId}
					onChange={(event) => updateField("misionId", event.target.value)}
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

			<div className="activity-form__field">
				<label htmlFor="activity-titulo">Título</label>
				<input
					id="activity-titulo"
					type="text"
					value={form.titulo}
					onChange={(event) => updateField("titulo", event.target.value)}
					required
				/>
			</div>

			<div className="activity-form__field">
				<label htmlFor="activity-descripcion">Descripción</label>
				<textarea
					id="activity-descripcion"
					rows={3}
					value={form.descripcion}
					onChange={(event) => updateField("descripcion", event.target.value)}
				/>
			</div>

			<div className="activity-form__field">
				<label htmlFor="activity-tipo">Tipo</label>
				<input
					id="activity-tipo"
					type="text"
					placeholder="ej: sopa_de_letras, memoria, rompecabezas"
					value={form.tipo}
					onChange={(event) => updateField("tipo", event.target.value)}
					required
				/>
			</div>

			<div className="activity-form__row">
				<div className="activity-form__field">
					<label htmlFor="activity-puntos">Puntos</label>
					<input
						id="activity-puntos"
						type="number"
						min="0"
						step="1"
						value={form.puntos}
						onChange={(event) => updateField("puntos", event.target.value)}
					/>
				</div>

				<div className="activity-form__field">
					<label htmlFor="activity-orden">Orden</label>
					<input
						id="activity-orden"
						type="number"
						value={form.orden}
						onChange={(event) => updateField("orden", event.target.value)}
					/>
				</div>
			</div>

			<div className="activity-form__field">
				<label htmlFor="activity-retroalimentacion">Retroalimentación</label>
				<textarea
					id="activity-retroalimentacion"
					rows={3}
					placeholder="Texto que ve el estudiante al completar la actividad (opcional)"
					value={form.retroalimentacion}
					onChange={(event) => updateField("retroalimentacion", event.target.value)}
				/>
			</div>

			<div className="activity-form__actions">
				<button type="button" className="activity-form__cancel" onClick={onCancel} disabled={submitting}>
					Cancelar
				</button>
				<button type="submit" className="activity-form__submit" disabled={submitting}>
					{submitting ? "Guardando..." : "Guardar"}
				</button>
			</div>
		</form>
	);
}

export default ActivityForm;
