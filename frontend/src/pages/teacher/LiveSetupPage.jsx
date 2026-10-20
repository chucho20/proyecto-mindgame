import { useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import * as teacherApi from "../../api/teacher.api.js";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import { useSala } from "../../context/SalaContext.js";
import { useAccionDeSala } from "../../hooks/useAccionDeSala.js";
import "../../components/realtime/realtime.css";
import "./TeacherPages.css";
import "./LiveSetupPage.css";

const MAX_ESTUDIANTES = 40;

/**
 * "Iniciar actividad en vivo" de un grupo (RF-019, CU-007 pasos 1-2): el docente elige una actividad activa y
 * cuántos estudiantes conectados hacen falta para empezar, y crea la sala; sigue en su sala de espera con el
 * código. Si ya tiene una sala abierta (recargó la página, por ejemplo) se la ofrece retomar, porque el
 * servidor permite una sala abierta por docente.
 */
function LiveSetupPage() {
	const { grupoId } = useParams();
	const navigate = useNavigate();
	const idPrefix = useId();
	const { crearSala, listarDisponibles, sala: salaActual, fin } = useSala();
	const [grupo, setGrupo] = useState(null);
	const [actividades, setActividades] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notFound, setNotFound] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [salaAbierta, setSalaAbierta] = useState(null);
	const [actividadId, setActividadId] = useState("");
	const [minimo, setMinimo] = useState("1");
	const [formError, setFormError] = useState("");

	const crear = useAccionDeSala(crearSala, { enfriamientoMs: 500 });

	useEffect(() => {
		let cancelled = false;

		async function cargar() {
			setLoading(true);
			setError("");
			setNotFound(false);

			try {
				const [{ grupo: datosGrupo }, { actividades: lista }] = await Promise.all([
					teacherApi.getGroup(grupoId),
					teacherApi.listActivities(),
				]);

				if (!cancelled) {
					setGrupo(datosGrupo);
					setActividades(lista);
				}
			} catch (err) {
				if (!cancelled) {
					if (err.response?.status === 404) {
						setNotFound(true);
					} else {
						setError(err.response?.data?.message || "No pudimos cargar los datos para crear la sala.");
					}
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargar();

		return () => {
			cancelled = true;
		};
	}, [grupoId, reloadKey]);

	// ¿El docente ya tiene una sala abierta? El servidor permite una sola, así que se la ofrece retomar.
	useEffect(() => {
		let cancelled = false;

		async function buscarSalaAbierta() {
			try {
				const salas = await listarDisponibles();

				if (!cancelled) {
					setSalaAbierta(salas[0] ?? null);
				}
			} catch {
				// Si no se pudo consultar, el intento de crear informa el motivo real.
			}
		}

		buscarSalaAbierta();

		return () => {
			cancelled = true;
		};
	}, [listarDisponibles]);

	const salaPropia = salaAbierta ?? (salaActual && !fin ? { sala_id: salaActual.id, ...salaActual } : null);

	async function handleSubmit(event) {
		event.preventDefault();
		setFormError("");

		if (!actividadId) {
			setFormError("Elegí la actividad que van a hacer.");
			return;
		}

		const cantidad = Number(minimo);

		if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_ESTUDIANTES) {
			setFormError(`El mínimo de estudiantes tiene que ser un número entero entre 1 y ${MAX_ESTUDIANTES}.`);
			return;
		}

		const resultado = await crear.ejecutar({ grupoId, actividadId, capacidadMinima: cantidad });

		if (resultado.ok) {
			navigate(`/docente/salas/${resultado.valor.id}`);
		} else if (["grupo_con_sala_activa", "ya_en_otra_sala"].includes(resultado.error?.codigo)) {
			// Ya tenía una sala abierta: se refresca el aviso para que pueda volver a ella.
			listarDisponibles()
				.then((salas) => setSalaAbierta(salas[0] ?? null))
				.catch(() => {});
		}
	}

	if (loading) {
		return (
			<div className="teacher-page">
				<p className="teacher-page__status">Cargando...</p>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="teacher-page">
				<Link to="/docente/grupos" className="teacher-page__back">
					← Mis grupos
				</Link>
				<p className="teacher-page__empty">
					<strong>No encontramos este grupo.</strong>
					Puede que no exista o que no sea uno de tus grupos.
				</p>
			</div>
		);
	}

	if (error || !grupo) {
		return (
			<div className="teacher-page">
				<Link to="/docente/grupos" className="teacher-page__back">
					← Mis grupos
				</Link>
				<p className="teacher-page__status teacher-page__status--error" role="alert">
					{error || "No pudimos cargar los datos."}{" "}
					<button
						type="button"
						className="teacher-page__retry"
						onClick={() => setReloadKey((key) => key + 1)}
					>
						Reintentar
					</button>
				</p>
			</div>
		);
	}

	return (
		<div className="teacher-page live-setup">
			<Link to={`/docente/grupos/${grupo.id}`} className="teacher-page__back">
				← {grupo.nombre}
			</Link>

			<PageHeader
				title="Iniciar actividad en vivo"
				description={`Los estudiantes de ${grupo.nombre} se conectan a una sala y hacen la actividad juntos, al mismo tiempo.`}
			/>

			{salaPropia ? (
				<div className="rt-notice rt-notice--warning live-setup__open" role="status">
					<p>
						Ya tenés una sala abierta
						{salaPropia.actividad?.titulo
							? `: ${salaPropia.actividad.titulo}${salaPropia.grupo?.nombre ? ` (grupo ${salaPropia.grupo.nombre})` : ""}`
							: ""}
						. Solo se puede tener una a la vez: volvé a ella o cerrala antes de crear otra.
					</p>
					<Link to={`/docente/salas/${salaPropia.sala_id}`} className="rt-btn rt-btn--primary">
						Volver a mi sala
					</Link>
				</div>
			) : null}

			<form className="rt-card live-setup__form" onSubmit={handleSubmit} noValidate>
				<fieldset className="live-setup__fieldset">
					<legend className="live-setup__legend">Actividad</legend>

					{actividades.length === 0 ? (
						<p className="teacher-page__empty">
							<strong>No hay actividades activas para elegir.</strong>
							Pedile al administrador que cargue alguna en el panel de contenido.
						</p>
					) : (
						<ul className="live-setup__options">
							{actividades.map((actividad) => (
								<li key={actividad.id}>
									<label
										className={
											String(actividad.id) === actividadId
												? "live-setup__option live-setup__option--selected"
												: "live-setup__option"
										}
									>
										<input
											type="radio"
											name={`${idPrefix}-actividad`}
											value={actividad.id}
											checked={String(actividad.id) === actividadId}
											onChange={() => {
												setActividadId(String(actividad.id));
												setFormError("");
											}}
										/>
										<span className="live-setup__option-body">
											<strong>{actividad.titulo}</strong>
											<span className="live-setup__option-meta">
												{actividad.mision_titulo ? `${actividad.mision_titulo} · ` : ""}
												{actividad.puntos} {actividad.puntos === 1 ? "punto" : "puntos"}
											</span>
											{actividad.descripcion ? (
												<span className="live-setup__option-description">{actividad.descripcion}</span>
											) : null}
										</span>
									</label>
								</li>
							))}
						</ul>
					)}
				</fieldset>

				<div className="live-setup__field">
					<label htmlFor={`${idPrefix}-minimo`} className="live-setup__legend">
						Mínimo de estudiantes conectados para poder iniciar
					</label>
					<input
						id={`${idPrefix}-minimo`}
						type="number"
						className="teacher-page__search live-setup__number"
						min={1}
						max={MAX_ESTUDIANTES}
						inputMode="numeric"
						value={minimo}
						onChange={(event) => {
							setMinimo(event.target.value);
							setFormError("");
						}}
						aria-describedby={`${idPrefix}-minimo-ayuda`}
					/>
					<p id={`${idPrefix}-minimo-ayuda`} className="rt-hint">
						El botón "Iniciar" se habilita cuando hay al menos esta cantidad de estudiantes en la sala (de 1 a{" "}
						{MAX_ESTUDIANTES}).
					</p>
				</div>

				{formError || crear.error ? (
					<p className="rt-notice rt-notice--error" role="alert">
						{formError || crear.error}
					</p>
				) : null}

				<div className="rt-actions">
					<button
						type="submit"
						className="rt-btn rt-btn--primary"
						disabled={crear.ocupado || actividades.length === 0}
					>
						{crear.ocupado ? "Creando la sala..." : "Crear sala"}
					</button>
					<Link to={`/docente/grupos/${grupo.id}`} className="rt-btn rt-btn--secondary">
						Cancelar
					</Link>
				</div>
			</form>
		</div>
	);
}

export default LiveSetupPage;
