import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard.jsx";
import PasswordInput from "../../components/auth/PasswordInput.jsx";
import * as authApi from "../../api/auth.api.js";
import "./AuthPages.css";

function ResetPasswordPage() {
	const { token } = useParams();
	const navigate = useNavigate();

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Las contraseñas no coinciden.");
			return;
		}

		setSubmitting(true);

		try {
			await authApi.resetPassword({ token, password });
			navigate("/login", { replace: true, state: { passwordReset: true } });
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos restablecer tu contraseña. Intentá de nuevo.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthCard
			title="Restablecer contraseña"
			subtitle="Elegí una nueva contraseña"
			footer={
				<p>
					<Link to="/login">Volver a iniciar sesión</Link>
				</p>
			}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				{error ? <div className="auth-form__error">{error}</div> : null}

				<PasswordInput
					id="password"
					label="Nueva contraseña"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="Mínimo 8 caracteres"
					autoComplete="new-password"
					required
				/>

				<PasswordInput
					id="confirmPassword"
					label="Confirmar contraseña"
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
					autoComplete="new-password"
					required
				/>

				<button type="submit" className="auth-form__submit" disabled={submitting}>
					{submitting ? "Guardando..." : "Restablecer contraseña"}
				</button>
			</form>
		</AuthCard>
	);
}

export default ResetPasswordPage;
