import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard.jsx";
import PasswordInput from "../../components/auth/PasswordInput.jsx";
import { useAuth } from "../../context/AuthContext.js";
import { ROLE_HOME_ROUTES } from "../../constants/roleRoutes.js";
import "./AuthPages.css";

function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const [correo, setCorreo] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			const user = await login(correo, password);
			const redirectTo = location.state?.from || ROLE_HOME_ROUTES[user.rol] || "/";
			navigate(redirectTo, { replace: true });
		} catch (err) {
			setError(err.response?.data?.message || "No pudimos iniciar sesión. Intentá de nuevo.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthCard
			title="Iniciar sesión"
			subtitle="Ingresá a tu cuenta de MindGame"
			footer={
				<>
					<p>
						¿No tenés cuenta? <Link to="/register">Registrate</Link>
					</p>
					<p>
						<Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
					</p>
				</>
			}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				{error ? <div className="auth-form__error">{error}</div> : null}

				<div className="auth-form__field">
					<label htmlFor="correo">Correo electrónico</label>
					<input
						id="correo"
						type="email"
						value={correo}
						onChange={(event) => setCorreo(event.target.value)}
						placeholder="tu@correo.com"
						autoComplete="email"
						required
					/>
				</div>

				<PasswordInput
					id="password"
					label="Contraseña"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="Tu contraseña"
					autoComplete="current-password"
					required
				/>

				<button type="submit" className="auth-form__submit" disabled={submitting}>
					{submitting ? "Ingresando..." : "Ingresar"}
				</button>
			</form>
		</AuthCard>
	);
}

export default LoginPage;
