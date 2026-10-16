
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

export async function obtenerEstadisticasPorRango(
  incubadoraId,
  variable,
  desde,
  hasta
) {
  try {
    if (!incubadoraId || !variable || !desde || !hasta) {
      throw new Error(
        "Debes proporcionar la incubadora, variable y rango de fechas."
      );
    }

    if (desde > hasta) {
      throw new Error(
        "La fecha inicial no puede ser posterior a la fecha final."
      );
    }

    const estadisticasRef = collection(db, "estadisticas");

    const consulta = query(
      estadisticasRef,
      where("incubadoraId", "==", incubadoraId),
      where("variable", "==", variable),
      where("fecha", ">=", desde),
      where("fecha", "<=", hasta),
      orderBy("fecha", "asc")
    );

    const snapshot = await getDocs(consulta);

    return snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));
  } catch (error) {
    console.error(
      "Error al obtener estadísticas por rango:",
      error
    );

    // Propaga el error para que la página pueda mostrarlo.
    throw error;
  }
}
