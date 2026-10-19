import { useId } from "react";

import { useDialogA11y } from "../../../hooks/useDialogA11y.js";
import "./ConfirmDialog.css";

/**
 * Confirmación de acciones destructivas en el panel admin (mismo overlay que
 * los paneles de alta/edición, porque Modal sigue siendo un stub vacío).
 * `onConfirm` puede ser async; mientras `busy` está activo se bloquean los botones.
 * `error` muestra el motivo si la acción falló y el diálogo sigue abierto.
 * Al abrirse el foco va a "Cancelar" (la opción segura), Tab queda atrapado
 * adentro, Escape cancela (salvo mientras `busy`) y el foco vuelve a quien lo abrió.
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
	const idPrefix = useId();
	const { dialogRef, backdropProps } = useDialogA11y({
		onClose: onCancel,
		closeDisabled: busy,
		initialFocus: ".confirm-dialog__cancel",
	});

	return (
		<div className="confirm-dialog__overlay" {...backdropProps}>
			<div
				className="confirm-dialog"
				ref={dialogRef}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={`${idPrefix}-title`}
				aria-describedby={`${idPrefix}-body`}
				tabIndex={-1}
			>
				<h2 id={`${idPrefix}-title`} className="confirm-dialog__title">
					{title}
				</h2>
				<div id={`${idPrefix}-body`} className="confirm-dialog__body">
					{children}
				</div>

				{error ? (
					<div className="confirm-dialog__error" role="alert">
						{error}
					</div>
				) : null}

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
