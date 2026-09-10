import { useState } from "react";
import { Link } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard.jsx";
import * as authApi from "../../api/auth.api.js";
import "./AuthPages.css";

function ForgotPasswordPage() {
	const [correo, setCorreo] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setMessage("");
		setSubmitting(true);

		try {
			const data = await authApi.forgotPassword({ correo });
			setMessage(
				data.message ||
					"Si el correo existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.",
			);
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos procesar la solicitud. Intentá de nuevo.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthCard
			title="Recuperar contraseña"
			subtitle="Te enviamos un enlace para restablecerla"
			footer={
				<p>
					<Link to="/login">Volver a iniciar sesión</Link>
				</p>
			}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				{error ? <div className="auth-form__error">{error}</div> : null}
				{message ? <div className="auth-form__success">{message}</div> : null}

				<div className="auth-form__field">
					<label htmlFor="correo">Correo electrónico</label>
					<input
						id="correo"
						type="email"
						value={correo}
						onChange={(event) => setCorreo(event.target.value)}
						autoComplete="email"
						required
					/>
				</div>

				<button type="submit" className="auth-form__submit" disabled={submitting}>
					{submitting ? "Enviando..." : "Enviar enlace"}
				</button>
			</form>
		</AuthCard>
	);
}

export default ForgotPasswordPage;
