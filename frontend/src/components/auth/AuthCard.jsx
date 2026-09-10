import "./AuthCard.css";

/**
 * Contenedor visual compartido por todas las pantallas de autenticación
 * (login, registro, recuperar/restablecer contraseña).
 */
function AuthCard({ title, subtitle, children, footer }) {
	return (
		<div className="auth-card-wrapper">
			<div className="auth-card">
				<div className="auth-card__header">
					<h1 className="auth-card__title">{title}</h1>
					{subtitle ? <p className="auth-card__subtitle">{subtitle}</p> : null}
				</div>

				<div className="auth-card__body">{children}</div>

				{footer ? <div className="auth-card__footer">{footer}</div> : null}
			</div>
		</div>
	);
}

export default AuthCard;
