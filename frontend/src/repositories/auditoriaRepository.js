
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  startAfter,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

export async function obtenerEventos({
  limite = 20,
  tipoEvento = null,
  cursor = null,
} = {}) {
  try {
    if (!Number.isInteger(limite) || limite < 1) {
      throw new Error(
        "El límite debe ser un número entero mayor que cero."
      );
    }

    const auditoriaRef = collection(db, "auditoria");

    const condiciones = [];

    if (tipoEvento) {
      condiciones.push(
        where("tipoEvento", "==", tipoEvento)
      );
    }

    condiciones.push(
      orderBy("ocurridoEn", "desc")
    );

    condiciones.push(limit(limite));

    if (cursor) {
      condiciones.push(startAfter(cursor));
    }

    const consulta = query(
      auditoriaRef,
      ...condiciones
    );

    const snapshot = await getDocs(consulta);

    const eventos = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));

    const nuevoCursor =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return {
      eventos,
      cursor: nuevoCursor,
    };
  } catch (error) {
    console.error(
      "Error al obtener eventos de auditoría:",
      error
    );

    // La página decide cómo presentar el error.
    throw error;
  }
}
