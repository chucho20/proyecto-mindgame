import SeleccionMultipleEvaluador from "./SeleccionMultipleEvaluador.js";
import VerdaderoFalsoEvaluador from "./VerdaderoFalsoEvaluador.js";
import RelacionElementosEvaluador from "./RelacionElementosEvaluador.js";
import OrdenCronologicoEvaluador from "./OrdenCronologicoEvaluador.js";

/**
 * Mapea `reto.tipo` -> evaluador concreto (Strategy, RNF-012).
 * Agregar un tipo de reto nuevo en el futuro = un archivo evaluador nuevo +
 * una línea acá. Cero cambios en reto.service.js ni en el controller.
 */
const evaluadorRegistry = {
	seleccion_multiple: SeleccionMultipleEvaluador,
	verdadero_falso: VerdaderoFalsoEvaluador,
	relacion_elementos: RelacionElementosEvaluador,
	orden_cronologico: OrdenCronologicoEvaluador,
};

/**
 * Devuelve el evaluador correspondiente al tipo de reto, o `null` si no hay
 * uno registrado (tipo desconocido/futuro sin implementar todavía).
 */
export function obtenerEvaluador(tipo) {
	return evaluadorRegistry[tipo] || null;
}

export default evaluadorRegistry;
