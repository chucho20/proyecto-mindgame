import { useCallback, useEffect, useState } from "react";

import AchievementCard from "../../components/student/AchievementCard/AchievementCard.jsx";
import PageHeader from "../../components/student/PageHeader/PageHeader.jsx";
import * as achievementsApi from "../../api/achievements.api.js";

import "./AchievementsPage.css";

function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await achievementsApi.getAchievements();

      // Permite trabajar tanto si la API devuelve directamente
      // el arreglo como si lo envuelve en { data: [...] }.
      const data = Array.isArray(response)
        ? response
        : response?.data ?? [];

      setAchievements(data);
    } catch (err) {
      console.error("Error al cargar los logros:", err);
      setError("No fue posible cargar tus logros. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const obtainedAchievements = achievements.filter(
    (achievement) =>
      achievement.obtenido === true ||
      achievement.obtenida === true ||
      achievement.estado === "obtenido"
  );

  const pendingAchievements = achievements.filter(
    (achievement) =>
      !(
        achievement.obtenido === true ||
        achievement.obtenida === true ||
        achievement.estado === "obtenido"
      )
  );

  const renderAchievement = (achievement) => {
    const obtenido =
      achievement.obtenido === true ||
      achievement.obtenida === true ||
      achievement.estado === "obtenido";

    return (
      <AchievementCard
        key={achievement.id}
        nombre={achievement.nombre}
        descripcion={achievement.descripcion}
        icono={achievement.icono}
        obtenido={obtenido}
        condicion={achievement.condicion}
      />
    );
  };

  return (
    <main className="achievements-page">
      <PageHeader
        title="Mis logros"
        subtitle="Descubre tus logros obtenidos y los que puedes desbloquear."
      />

      {loading && (
        <section className="achievements-page__state">
          <div className="achievements-page__loader" aria-hidden="true" />
          <p>Cargando tus logros...</p>
        </section>
      )}

      {!loading && error && (
        <section className="achievements-page__state achievements-page__state--error">
          <p>{error}</p>

          <button
            type="button"
            className="achievements-page__retry"
            onClick={loadAchievements}
          >
            Intentar nuevamente
          </button>
        </section>
      )}

      {!loading && !error && (
        <div className="achievements-page__content">
          <section className="achievements-section">
            <div className="achievements-section__header">
              <div>
                <h2>Logros obtenidos</h2>
                <p>Estos logros ya forman parte de tu progreso.</p>
              </div>

              <span className="achievements-section__count">
                {obtainedAchievements.length}
              </span>
            </div>

            {obtainedAchievements.length > 0 ? (
              <div className="achievements-grid">
                {obtainedAchievements.map(renderAchievement)}
              </div>
            ) : (
              <div className="achievements-empty">
                <span
                  className="achievements-empty__icon"
                  aria-hidden="true"
                >
                  🏆
                </span>

                <h3>Aún no tienes logros obtenidos</h3>
                <p>
                  Completa misiones y actividades para comenzar a
                  desbloquearlos.
                </p>
              </div>
            )}
          </section>

          <section className="achievements-section">
            <div className="achievements-section__header">
              <div>
                <h2>Logros pendientes</h2>
                <p>Continúa jugando para desbloquear nuevos logros.</p>
              </div>

              <span className="achievements-section__count">
                {pendingAchievements.length}
              </span>
            </div>

            {pendingAchievements.length > 0 ? (
              <div className="achievements-grid">
                {pendingAchievements.map(renderAchievement)}
              </div>
            ) : (
              <div className="achievements-empty achievements-empty--complete">
                <span
                  className="achievements-empty__icon"
                  aria-hidden="true"
                >
                  🎉
                </span>

                <h3>¡Has desbloqueado todos los logros!</h3>
                <p>
                  Sigue participando en MindGame y continúa aprendiendo.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default AchievementsPage;