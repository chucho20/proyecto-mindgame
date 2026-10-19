import ProgressionItemForm from "../ProgressionItemForm/ProgressionItemForm.jsx";

const LABELS = {
	nombrePlaceholder: "Ej: Explorador experto",
	descripcionPlaceholder: "Describí cómo se obtiene esta recompensa.",
	saveError: "No pudimos guardar la recompensa.",
};

/**
 * Formulario de alta/edición de recompensas (RF-015). Toda la lógica vive en
 * ProgressionItemForm, compartido con AchievementForm. `initialValues` es la
 * recompensa tal como la devuelve la API (snake_case).
 */
function RewardForm(props) {
	return <ProgressionItemForm {...props} labels={LABELS} />;
}

export default RewardForm;
