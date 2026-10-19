import "./ConfirmDialog.css";

/**
 * Confirmación de acciones destructivas en el panel admin (mismo overlay que
 * los paneles de alta/edición, porque Modal sigue siendo un stub vacío).
 * `onConfirm` puede ser async; mientras `busy` está activo se bloquean los botones.
 * `error` muestra el motivo si la acción falló y el diálogo sigue abierto.
 */
function ConfirmDialog({
	title,
	children,
	confirmLabel = "Eliminar",
	busy = false,
	error = "",
	onConfirm,
	onCancel,
}) {
	return (
		<div className="confirm-dialog__overlay" onClick={busy ? undefined : onCancel}>
			<div
				className="confirm-dialog"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="confirm-dialog-title"
				onClick={(event) => event.stopPropagation()}
			>
				<h2 id="confirm-dialog-title" className="confirm-dialog__title">
					{title}
				</h2>
				<div className="confirm-dialog__body">{children}</div>

				{error ? <div className="confirm-dialog__error">{error}</div> : null}

				<div className="confirm-dialog__actions">
					<button type="button" className="confirm-dialog__cancel" onClick={onCancel} disabled={busy}>
						Cancelar
					</button>
					<button type="button" className="confirm-dialog__confirm" onClick={onConfirm} disabled={busy}>
						{busy ? "Eliminando..." : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ConfirmDialog;
