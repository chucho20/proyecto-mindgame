import "./PageHeader.css";

/**
 * Encabezado reusable de página: título + descripción + slot de acciones
 * (ej. botón "Nueva misión" en las páginas admin).
 */
function PageHeader({ title, description, actions }) {
	return (
		<div className="page-header">
			<div>
				<h1 className="page-header__title">{title}</h1>
				{description ? <p className="page-header__description">{description}</p> : null}
			</div>
			{actions ? <div className="page-header__actions">{actions}</div> : null}
		</div>
	);
}

export default PageHeader;
