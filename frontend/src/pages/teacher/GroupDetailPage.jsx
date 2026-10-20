import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import * as teacherApi from "../../api/teacher.api.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog/ConfirmDialog.jsx";
import DataTable from "../../components/admin/DataTable/DataTable.jsx";
import PageHeader from "../../components/layout/PageHeader/PageHeader.jsx";
import GroupCode from "../../components/teacher/GroupCode/GroupCode.jsx";
import { avatarEmoji } from "../../constants/avatars.js";
import { formatearFecha, formatearNumero, mensajeDeError, SIN_DATO } from "../../utils/estadisticas.js";
import "./TeacherPages.css";

/**
 * Detalle de un grupo del docente (RF-022): código para compartir, estudiantes
 * con su nivel y puntos, retiro de estudiantes y accesos a las estadísticas
 * (RF-023). Un grupo inexistente o de otro docente responde 404 y se muestra
 * como "no encontrado".
 */
function GroupDetailPage() {
	const { grupoId } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notFound, setNotFound] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [estudianteRetirando, setEstudianteRetirando] = useState(null);
	const [removing, setRemoving] = useState(false);
	const [removeError, setRemoveError] = useState("");
	const [actionMessage, setActionMessage] = useState("");
	const avisoRef = useRef(null);

	// Al retirar a un estudiante desaparece el botón que abrió el diálogo: el foco va al aviso.
	useEffect(() => {
		if (actionMessage) {
			avisoRef.current?.focus();
		}
	}, [actionMessage]);

	useEffect(() => {
		let cancelled = false;

		async function cargarGrupo() {
			setLoading(true);
			setError("");
			setNotFound(false);
			setData(null);

			try {
				const result = await teacherApi.listGroupStudents(grupoId);

				if (!cancelled) {
					setData(result);
				}
			} catch (err) {
				if (!cancelled) {
					if (err.response?.status === 404) {
						setNotFound(true);
					} else {
						setError(err.response?.data?.message || "No pudimos cargar el grupo.");
					}
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		cargarGrupo();

		return () => {
			cancelled = true;
		};
	}, [grupoId, reloadKey]);

	function pedirRetiro(estudiante) {
		setRemoveError("");
		setEstudianteRetirando(estudiante);
	}

	async function confirmarRetiro() {
		const estudiante = estudianteRetirando;
		setRemoving(true);
		setRemoveError("");

		try {
			await teacherApi.removeStudentFromGroup(grupoId, estudiante.id);
		} catch (err) {
			setRemoveError(mensajeDeError(err, "No pudimos retirar al estudiante."));
			setRemoving(false);
			return;
		}

		setRemoving(false);
		setEstudianteRetirando(null);
		setActionMessage(`${estudiante.nombre_completo} fue retirado del grupo. Su cuenta sigue activa.`);
		setData((actual) => ({
			grupo: { ...actual.grupo, total_estudiantes: Math.max(0, (actual.grupo.total_estudiantes ?? 1) - 1) },
			estudiantes: actual.estudiantes.filter((item) => item.id !== estudiante.id),
		}));
	}

	if (loading) {
		return (
			<div className="teacher-page">
				<p className="teacher-page__status">Cargando el grupo...</p>
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

	if (error || !data) {
		return (
			<div className="teacher-page">
				<Link to="/docente/grupos" className="teacher-page__back">
					← Mis grupos
				</Link>
				<p className="teacher-page__status teacher-page__status--error" role="alert">
					{error || "No pudimos cargar el grupo."}{" "}
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

	const { grupo, estudiantes } = data;

	const columns = [
		{
			key: "nombre_completo",
			label: "Estudiante",
			render: (row) => (
				<Link to={`/docente/estudiantes/${row.id}/estadisticas`} className="teacher-page__student-link">
					<span aria-hidden="true">{avatarEmoji(row.avatar)}</span>
					{row.nombre_completo}
				</Link>
			),
		},
		{ key: "nombre_usuario", label: "Usuario", render: (row) => row.nombre_usuario || SIN_DATO },
		{ key: "grado_curso", label: "Grado", render: (row) => row.grado_curso || SIN_DATO },
		{ key: "nivel_actual", label: "Nivel", render: (row) => formatearNumero(row.nivel_actual) },
		{ key: "puntos_totales", label: "Puntos", render: (row) => formatearNumero(row.puntos_totales) },
		{ key: "unido_en", label: "Se unió", render: (row) => formatearFecha(row.unido_en) },
	];

	return (
		<div className="teacher-page">
			<Link to="/docente/grupos" className="teacher-page__back">
				← Mis grupos
			</Link>

			<PageHeader
				title={grupo.nombre}
				description="Estudiantes que se unieron con el código de este grupo."
				actions={
					<div className="teacher-page__actions-row">
						<Link to={`/docente/grupos/${grupo.id}/en-vivo`} className="teacher-page__primary">
							Iniciar actividad en vivo
						</Link>
						<Link to={`/docente/grupos/${grupo.id}/estadisticas`} className="teacher-page__secondary">
							Ver estadísticas del grupo
						</Link>
					</div>
				}
			/>

			<div className="teacher-page__meta">
				<span>Código:</span>
				<GroupCode codigo={grupo.codigo} />
				<span>
					{grupo.total_estudiantes === 1 ? "1 estudiante" : `${grupo.total_estudiantes ?? 0} estudiantes`}
				</span>
			</div>

			{actionMessage ? (
				<p className="teacher-page__status" role="status" ref={avisoRef} tabIndex={-1}>
					{actionMessage}
				</p>
			) : null}

			<section className="teacher-page__section" aria-label="Estudiantes del grupo">
				<h2 className="teacher-page__section-title">Estudiantes</h2>
				<DataTable
					columns={columns}
					rows={estudiantes}
					emptyMessage="Todavía no hay estudiantes en este grupo. Compartí el código para que se unan."
					renderActions={(estudiante) => (
						<>
							<Link
								to={`/docente/estudiantes/${estudiante.id}/estadisticas`}
								className="teacher-page__action"
								aria-label={`Ver estadísticas de ${estudiante.nombre_completo}`}
							>
								Estadísticas
							</Link>
							<button
								type="button"
								className="teacher-page__action teacher-page__action--danger"
								onClick={() => pedirRetiro(estudiante)}
								aria-label={`Retirar a ${estudiante.nombre_completo} del grupo`}
							>
								Retirar
							</button>
						</>
					)}
				/>
			</section>

			{estudianteRetirando ? (
				<ConfirmDialog
					title="Retirar estudiante"
					confirmLabel="Retirar"
					busyLabel="Retirando..."
					busy={removing}
					error={removeError}
					onConfirm={confirmarRetiro}
					onCancel={() => setEstudianteRetirando(null)}
				>
					<p>
						¿Seguro que querés retirar a <strong>{estudianteRetirando.nombre_completo}</strong> del grupo{" "}
						<strong>{grupo.nombre}</strong>?
					</p>
					<p>
						El estudiante conserva su cuenta y su progreso: solo deja de formar parte del grupo y no lo vas a
						ver más en sus estadísticas. Podrá volver a unirse con el código.
					</p>
				</ConfirmDialog>
			) : null}
		</div>
	);
}

export default GroupDetailPage;
