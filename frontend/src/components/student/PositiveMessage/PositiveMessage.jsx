
import React from "react";
import "./PositiveMessage.css";

/**
 * PositiveMessage
 *
 * Muestra un mensaje positivo recibido desde el backend.
 *
 * Props:
 * - message: texto del mensaje recibido.
 * - title: título opcional del mensaje.
 * - type: tipo visual del mensaje.
 * - onClose: función opcional para cerrar/ocultar el mensaje.
 */
const PositiveMessage = ({
  message,
  title = "¡Buen trabajo!",
  type = "success",
  onClose,
}) => {
  if (!message) {
    return null;
  }

  return (
    <article
      className={`positive-message positive-message--${type}`}
      role="status"
      aria-live="polite"
    >
      <div className="positive-message__icon" aria-hidden="true">
        ★
      </div>

      <div className="positive-message__content">
        <h2 className="positive-message__title">{title}</h2>

        <p className="positive-message__text">{message}</p>
      </div>

      {onClose && (
        <button
          type="button"
          className="positive-message__close"
          onClick={onClose}
          aria-label="Cerrar mensaje"
        >
          ×
        </button>
      )}
    </article>
  );
};

export default PositiveMessage;
