import ProgressionItemForm from "../ProgressionItemForm/ProgressionItemForm.jsx";

const LABELS = {
	nombrePlaceholder: "Ej: Primer paso",
	descripcionPlaceholder: "Describí qué hizo el estudiante para ganar este logro.",
	saveError: "No pudimos guardar el logro.",
};

/**
 * Formulario de alta/edición de logros. Mismo contrato y validación
 * que RewardForm: la lógica vive en ProgressionItemForm. `initialValues` es el
 * logro tal como lo devuelve la API (snake_case).
 */
function AchievementForm(props) {
	return <ProgressionItemForm {...props} labels={LABELS} />;
}

export default AchievementForm;
