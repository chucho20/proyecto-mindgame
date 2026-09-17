import { useCallback, useEffect, useState } from "react";

import * as positiveMessagesApi from "../../api/positiveMessages.api.js";

import "./PositiveMessagesAdminPage.css";

const EMPTY_FORM = {
  mensaje: "",
};

function PositiveMessagesAdminPage() {
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await positiveMessagesApi.listPositiveMessages();

      const data = Array.isArray(response)
        ? response
        : response?.data ?? [];

      setMessages(data);
    } catch (err) {
      console.error("Error al cargar los mensajes positivos:", err);
      setError("No fue posible cargar los mensajes positivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  };

  const handleNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (message) => {
    setEditingId(message.id);

    setForm({
      mensaje: message.mensaje ?? message.contenido ?? "",
    });

    setFormError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const mensaje = form.mensaje.trim();

    if (!mensaje) {
      setFormError("El mensaje es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        mensaje,
      };

      if (editingId) {
        await positiveMessagesApi.updatePositiveMessage(
          editingId,
          payload
        );
      } else {
        await positiveMessagesApi.createPositiveMessage(payload);
      }

      await loadMessages();

      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Error al guardar el mensaje positivo:", err);

      setFormError(
        editingId
          ? "No fue posible actualizar el mensaje."
          : "No fue posible crear el mensaje."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (message) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el mensaje "${message.mensaje ?? message.contenido}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await positiveMessagesApi.deletePositiveMessage(message.id);

      await loadMessages();
    } catch (err) {
      console.error("Error al eliminar el mensaje positivo:", err);
      setError("No fue posible eliminar el mensaje.");
    }
  };

  return (
    <main className="positive-messages-admin">
      <header className="positive-messages-admin__header">
        <div>
          <h1>Mensajes positivos</h1>
          <p>
            Administra los mensajes positivos que pueden recibir los
            estudiantes.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            className="positive-messages-admin__primary-button"
            onClick={handleNew}
          >
            + Nuevo mensaje
          </button>
        )}
      </header>

      {showForm && (
        <section className="positive-messages-admin__form-card">
          <div className="positive-messages-admin__form-header">
            <div>
              <h2>
                {editingId
                  ? "Editar mensaje positivo"
                  : "Nuevo mensaje positivo"}
              </h2>

              <p>
                Escribe un mensaje breve, claro y motivador.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="positive-messages-admin__field">
              <label htmlFor="mensaje">
                Mensaje <span>*</span>
              </label>

              <textarea
                id="mensaje"
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                placeholder="Ej. ¡Excelente trabajo! Sigue así."
                rows={4}
                maxLength={500}
                disabled={saving}
              />

              <div className="positive-messages-admin__field-footer">
                <small>
                  Máximo 500 caracteres.
                </small>

                <small>
                  {form.mensaje.length}/500
                </small>
              </div>
            </div>

            {formError && (
              <p className="positive-messages-admin__form-error">
                {formError}
              </p>
            )}

            <div className="positive-messages-admin__form-actions">
              <button
                type="button"
                className="positive-messages-admin__secondary-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="positive-messages-admin__primary-button"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear mensaje"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <div className="positive-messages-admin__error">
          <p>{error}</p>

          <button
            type="button"
            onClick={loadMessages}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <section className="positive-messages-admin__list-card">
        <div className="positive-messages-admin__list-header">
          <div>
            <h2>Mensajes registrados</h2>
            <p>
              {messages.length} mensaje
              {messages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="positive-messages-admin__state">
            <div className="positive-messages-admin__loader" />
            <p>Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="positive-messages-admin__empty">
            <span
              className="positive-messages-admin__empty-icon"
              aria-hidden="true"
            >
              💬
            </span>

            <h3>No hay mensajes positivos</h3>

            <p>
              Crea el primer mensaje positivo para comenzar.
            </p>

            {!showForm && (
              <button
                type="button"
                className="positive-messages-admin__primary-button"
                onClick={handleNew}
              >
                Crear mensaje
              </button>
            )}
          </div>
        ) : (
          <div className="positive-messages-admin__table-wrapper">
            <table className="positive-messages-admin__table">
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th className="positive-messages-admin__actions-column">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {messages.map((message) => (
                  <tr key={message.id}>
                    <td>
                      <div className="positive-messages-admin__message">
                        <span
                          className="positive-messages-admin__message-icon"
                          aria-hidden="true"
                        >
                          💬
                        </span>

                        <span>
                          {message.mensaje ?? message.contenido}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="positive-messages-admin__actions">
                        <button
                          type="button"
                          className="positive-messages-admin__edit-button"
                          onClick={() => handleEdit(message)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="positive-messages-admin__delete-button"
                          onClick={() => handleDelete(message)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default PositiveMessagesAdminPage;