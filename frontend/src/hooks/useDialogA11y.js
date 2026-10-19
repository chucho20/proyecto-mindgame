import { useEffect, useRef } from "react";

const FOCUSABLES =
	'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accesibilidad de un diálogo modal (panel de alta/edición o confirmación):
 * - al abrirse mueve el foco adentro (al elemento que cumpla `initialFocus`, o al primero que se pueda enfocar);
 * - Tab y Shift+Tab quedan atrapados dentro del diálogo;
 * - Escape lo cierra (salvo que `closeDisabled` esté activo, p. ej. mientras se guarda);
 * - al cerrarse devuelve el foco al elemento que lo abrió;
 * - `backdropProps` cierra solo con un clic que empieza Y termina sobre el fondo, así
 *   arrastrar el mouse desde un campo hasta afuera (o al revés) no descarta lo escrito.
 *
 * Devuelve `dialogRef` (va en el elemento con `role="dialog"` y `tabIndex={-1}`) y
 * `backdropProps` (van en el fondo que lo contiene).
 */
export function useDialogA11y({ open = true, onClose, closeDisabled = false, initialFocus }) {
	const dialogRef = useRef(null);
	const pressStartedOnBackdrop = useRef(false);
	const pressEndedOnBackdrop = useRef(false);

	useEffect(() => {
		if (!open) {
			return undefined;
		}

		const trigger = document.activeElement;
		const dialog = dialogRef.current;
		const initial = initialFocus ? dialog?.querySelector(initialFocus) : null;
		(initial ?? dialog?.querySelector(FOCUSABLES) ?? dialog)?.focus();

		return () => {
			if (trigger instanceof HTMLElement && trigger.isConnected) {
				trigger.focus();
			}
		};
	}, [open, initialFocus]);

	useEffect(() => {
		if (!open) {
			return undefined;
		}

		function handleKeyDown(event) {
			const dialog = dialogRef.current;

			if (!dialog) {
				return;
			}

			if (event.key === "Escape") {
				if (!closeDisabled) {
					event.preventDefault();
					onClose?.();
				}
				return;
			}

			if (event.key !== "Tab") {
				return;
			}

			const focusables = [...dialog.querySelectorAll(FOCUSABLES)];
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement;

			if (!first) {
				event.preventDefault();
				dialog.focus();
			} else if (!dialog.contains(active) || active === dialog) {
				event.preventDefault();
				(event.shiftKey ? last : first).focus();
			} else if (event.shiftKey && active === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && active === last) {
				event.preventDefault();
				first.focus();
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose, closeDisabled]);

	// El `click` del navegador se dispara sobre el ancestro común de donde se apretó y se
	// soltó el botón: arrastrar desde el panel al fondo (o al revés) también lo dispararía
	// sobre el fondo, por eso se anota por separado dónde empezó y dónde terminó la pulsación.
	const backdropProps = {
		onMouseDown(event) {
			pressStartedOnBackdrop.current = event.target === event.currentTarget;
			pressEndedOnBackdrop.current = false;
		},
		onMouseUp(event) {
			pressEndedOnBackdrop.current = event.target === event.currentTarget;
		},
		onClick(event) {
			const empezoYTerminoEnElFondo =
				pressStartedOnBackdrop.current && pressEndedOnBackdrop.current && event.target === event.currentTarget;
			pressStartedOnBackdrop.current = false;
			pressEndedOnBackdrop.current = false;

			if (empezoYTerminoEnElFondo && !closeDisabled) {
				onClose?.();
			}
		},
	};

	return { dialogRef, backdropProps };
}
