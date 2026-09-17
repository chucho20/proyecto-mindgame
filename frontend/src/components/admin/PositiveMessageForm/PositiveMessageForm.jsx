import { useEffect, useState } from "react";

import "./PositiveMessageForm.css";

const INITIAL_FORM = {
  contenido: "",
  contexto: "",
};

function PositiveMessageForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contenido: initialData.contenido ?? "",
        contexto: initialData.contexto ?? "",
      });
    } else {
      setFormData(INITIAL_FORM);
    }

    setErrors({});
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.contenido.trim()) {
      newErrors.contenido = "El contenido es obligatorio.";
    }

    if (!formData.contexto.trim()) {
      newErrors.contexto = "El contexto es obligatorio.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit?.({
      contenido: formData.contenido.trim(),
      contexto: formData.contexto.trim(),
    });
  };

  return (
    <form className="positive-message-form" onSubmit={handleSubmit}>
      <div className="positive-message-form__header">
        <h2>
          {isEditing
            ? "Editar mensaje positivo"
            : "Crear mensaje positivo"}
        </h2>

        <p>
          {isEditing
            ? "Actualiza el contenido y contexto del mensaje."
            : "Crea un mensaje que pueda acompañar la experiencia del estudiante."}
        </p>
      </div>

      <div className="positive-message-form__fields">
        <div className="positive-message-form__field">
          <label htmlFor="contenido">
            Contenido <span aria-hidden="true">*</span>
          </label>

          <textarea
            id="contenido"
            name="contenido"
            value={formData.contenido}
            onChange={handleChange}
            placeholder="Ej. ¡Excelente trabajo! Sigue aprendiendo y creciendo."
            rows={5}
            disabled={loading}
            aria-invalid={Boolean(errors.contenido)}
            aria-describedby={
              errors.contenido ? "contenido-error" : undefined
            }
          />

          {errors.contenido && (
            <span
              id="contenido-error"
              className="positive-message-form__error"
            >
              {errors.contenido}
            </span>
          )}
        </div>

        <div className="positive-message-form__field">
          <label htmlFor="contexto">
            Contexto <span aria-hidden="true">*</span>
          </label>

          <input
            id="contexto"
            name="contexto"
            type="text"
            value={formData.contexto}
            onChange={handleChange}
            placeholder="Ej. convivencia, reto completado"
            disabled={loading}
            aria-invalid={Boolean(errors.contexto)}
            aria-describedby={
              errors.contexto ? "contexto-error" : undefined
            }
          />

          {errors.contexto && (
            <span
              id="contexto-error"
              className="positive-message-form__error"
            >
              {errors.contexto}
            </span>
          )}

          <small className="positive-message-form__help">
            Indica en qué situación puede utilizarse el mensaje.
          </small>
        </div>
      </div>

      <div className="positive-message-form__actions">
        <button
          type="button"
          className="positive-message-form__button positive-message-form__button--cancel"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="positive-message-form__button positive-message-form__button--submit"
          disabled={loading}
        >
          {loading
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear mensaje"}
        </button>
      </div>
    </form>
  );
}

export default PositiveMessageForm;