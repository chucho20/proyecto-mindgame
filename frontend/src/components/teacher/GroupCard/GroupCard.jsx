import { Link } from "react-router-dom";

import GroupCode from "../GroupCode/GroupCode.jsx";
import "./GroupCard.css";

/**
 * Tarjeta de un grupo del docente (RF-022): nombre, cantidad de estudiantes y
 * código con botón "Copiar". El título enlaza al detalle del grupo; el botón de
 * copiar queda fuera del enlace para no anidar controles interactivos.
 */
function GroupCard({ grupo }) {
	const total = grupo.total_estudiantes ?? 0;

	return (
		<article className="group-card">
			<div className="group-card__icon" aria-hidden="true">
				👥
			</div>

			<div className="group-card__body">
				<h2 className="group-card__name">
					<Link to={`/docente/grupos/${grupo.id}`} className="group-card__link">
						{grupo.nombre}
					</Link>
				</h2>
				<p className="group-card__students">{total === 1 ? "1 estudiante" : `${total} estudiantes`}</p>
				<GroupCode codigo={grupo.codigo} />
				{/* Atajo visual para el mouse: el título ya es el enlace accesible al mismo destino. */}
				<Link
					to={`/docente/grupos/${grupo.id}`}
					className="group-card__open"
					aria-hidden="true"
					tabIndex={-1}
				>
					Ver grupo →
				</Link>
			</div>
		</article>
	);
}

export default GroupCard;
