import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as profileApi from "../../api/profile.api.js";
import { useAuth } from "../../context/AuthContext.js";
import { AVATAR_OPTIONS, avatarEmoji } from "../../constants/avatars.js";
import "./ProfilePage.css";

function ProfilePage() {
	const { user: sessionUser, logout } = useAuth();
	const navigate = useNavigate();
	const [loggingOut, setLoggingOut] = useState(false);

	async function handleLogout() {
		setLoggingOut(true);
		await logout();
		navigate("/login", { replace: true });
	}

	const [profile, setProfile] = useState(null);
	const [form, setForm] = useState({ nombreCompleto: "", edad: "", gradoCurso: "", avatar: "" });
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadProfile() {
			setLoading(true);
			setError("");

			try {
				const { user } = await profileApi.getProfile();

				if (!cancelled) {
					setProfile(user);
					setForm({
						nombreCompleto: user.nombre_completo || "",
						edad: user.edad ?? "",
						gradoCurso: user.grado_curso || "",
						avatar: user.avatar || "",
					});
				}
			} catch (err) {
				if (!cancelled) {
					setError(err.response?.data?.message || "No pudimos cargar tu perfil.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		loadProfile();

		return () => {
			cancelled = true;
		};
	}, []);

	function updateField(field, value) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSuccess("");
		setSaving(true);

		try {
			const { user } = await profileApi.updateProfile(form);
			setProfile(user);
			setSuccess("Perfil actualizado correctamente.");
		} catch (err) {
			const details = err.response?.data?.details;
			setError(
				(details && details.length > 0 ? details.join(" ") : null) ||
					err.response?.data?.message ||
					"No pudimos actualizar tu perfil.",
			);
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return <div className="profile-page profile-page--loading">Cargando perfil...</div>;
	}

	return (
		<div className="profile-page">
			<div className="profile-page__card">
				<div className="profile-page__header">
					<div className="profile-page__avatar">{avatarEmoji(form.avatar)}</div>
					<div className="profile-page__identity">
						<h1>{profile?.nombre_completo || sessionUser?.nombre_completo}</h1>
						<p className="profile-page__role">{profile?.rol}</p>
					</div>
					<button type="button" className="profile-page__logout" onClick={handleLogout} disabled={loggingOut}>
						{loggingOut ? "Cerrando..." : "Cerrar sesión"}
					</button>
				</div>

				<form className="profile-form" onSubmit={handleSubmit}>
					{error ? <div className="profile-form__error">{error}</div> : null}
					{success ? <div className="profile-form__success">{success}</div> : null}

					<div className="profile-form__field">
						<label htmlFor="nombreCompleto">Nombre completo</label>
						<input
							id="nombreCompleto"
							type="text"
							value={form.nombreCompleto}
							onChange={(event) => updateField("nombreCompleto", event.target.value)}
						/>
					</div>

					<div className="profile-form__row">
						<div className="profile-form__field">
							<label htmlFor="edad">Edad</label>
							<input
								id="edad"
								type="number"
								min="1"
								value={form.edad}
								onChange={(event) => updateField("edad", event.target.value)}
							/>
						</div>

						<div className="profile-form__field">
							<label htmlFor="gradoCurso">Grado / curso</label>
							<input
								id="gradoCurso"
								type="text"
								value={form.gradoCurso}
								onChange={(event) => updateField("gradoCurso", event.target.value)}
							/>
						</div>
					</div>

					<div className="profile-form__field">
						<span>Elegí tu avatar</span>
						<div className="profile-form__avatars">
							{AVATAR_OPTIONS.map((option) => (
								<button
									key={option.id}
									type="button"
									className={
										form.avatar === option.id
											? "profile-form__avatar-option profile-form__avatar-option--active"
											: "profile-form__avatar-option"
									}
									onClick={() => updateField("avatar", option.id)}
									aria-pressed={form.avatar === option.id}
									aria-label={option.id}
								>
									{option.emoji}
								</button>
							))}
						</div>
					</div>

					<button type="submit" className="profile-form__submit" disabled={saving}>
						{saving ? "Guardando..." : "Guardar cambios"}
					</button>
				</form>
			</div>
		</div>
	);
}

export default ProfilePage;
