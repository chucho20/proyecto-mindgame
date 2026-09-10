import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard.jsx";
import PasswordInput from "../../components/auth/PasswordInput.jsx";
import { useAuth } from "../../context/AuthContext.js";
import "./AuthPages.css";

const ROLE_OPTIONS = [
	{ value: "estudiante", label: "Soy estudiante" },
	{ value: "docente", label: "Soy docente" },
];

const INITIAL_FORM = {
	rol: "estudiante",
	nombreCompleto: "",
	correo: "",
	nombreUsuario: "",
	password: "",
	edad: "",
	gradoCurso: "",
	aceptaTratamientoDatos: false,
};

function RegisterPage() {
	const { register } = useAuth();
	const navigate = useNavigate();

	const [form, setForm] = useState(INITIAL_FORM);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	function updateField(field, value) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			await register(form);
			navigate("/login", {
				replace: true,
				state: { registered: true },
			});
		} catch (err) {
			const details = err.response?.data?.details;
			setError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					err.response?.data?.message ||
					"No pudimos crear tu cuenta. Intentá de nuevo.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthCard
			title="Crear cuenta"
			subtitle="Sumate a MindGame"
			footer={
				<p>
					¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
				</p>
			}
		>
			<form className="auth-form" onSubmit={handleSubmit}>
				{error ? <div className="auth-form__error">{error}</div> : null}

				<div className="auth-form__role-toggle" role="radiogroup" aria-label="Tipo de cuenta">
					{ROLE_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							role="radio"
							aria-checked={form.rol === option.value}
							className={
								form.rol === option.value
									? "auth-form__role-option auth-form__role-option--active"
									: "auth-form__role-option"
							}
							onClick={() => updateField("rol", option.value)}
						>
							{option.label}
						</button>
					))}
				</div>

				<div className="auth-form__field">
					<label htmlFor="nombreCompleto">Nombre completo</label>
					<input
						id="nombreCompleto"
						type="text"
						value={form.nombreCompleto}
						onChange={(event) => updateField("nombreCompleto", event.target.value)}
						required
					/>
				</div>

				<div className="auth-form__field">
					<label htmlFor="correo">Correo electrónico</label>
					<input
						id="correo"
						type="email"
						value={form.correo}
						onChange={(event) => updateField("correo", event.target.value)}
						autoComplete="email"
						required
					/>
				</div>

				<div className="auth-form__field">
					<label htmlFor="nombreUsuario">Nombre de usuario</label>
					<input
						id="nombreUsuario"
						type="text"
						value={form.nombreUsuario}
						onChange={(event) => updateField("nombreUsuario", event.target.value)}
						required
					/>
				</div>

				<PasswordInput
					id="password"
					label="Contraseña"
					value={form.password}
					onChange={(event) => updateField("password", event.target.value)}
					placeholder="Mínimo 8 caracteres"
					autoComplete="new-password"
					required
				/>

				<div className="auth-form__row">
					<div className="auth-form__field">
						<label htmlFor="edad">Edad</label>
						<input
							id="edad"
							type="number"
							min="1"
							value={form.edad}
							onChange={(event) => updateField("edad", event.target.value)}
						/>
					</div>

					<div className="auth-form__field">
						<label htmlFor="gradoCurso">Grado / curso</label>
						<input
							id="gradoCurso"
							type="text"
							value={form.gradoCurso}
							onChange={(event) => updateField("gradoCurso", event.target.value)}
						/>
					</div>
				</div>

				<label className="auth-form__checkbox" htmlFor="aceptaTratamientoDatos">
					<input
						id="aceptaTratamientoDatos"
						type="checkbox"
						checked={form.aceptaTratamientoDatos}
						onChange={(event) => updateField("aceptaTratamientoDatos", event.target.checked)}
						required
					/>
					<span>
						Acepto el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 (protección de datos
						de menores). Este texto es un placeholder pendiente de revisión legal.
					</span>
				</label>

				<button type="submit" className="auth-form__submit" disabled={submitting}>
					{submitting ? "Creando cuenta..." : "Crear cuenta"}
				</button>
			</form>
		</AuthCard>
	);
}

export default RegisterPage;
