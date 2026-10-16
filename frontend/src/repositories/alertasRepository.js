import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const COLECCION_ALERTAS = "alertas";

export async function actualizarEstado(alertaId, nuevoEstado) {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Debes iniciar sesión para actualizar el estado de una alerta.");
  }

  const actualizacion = {
    estado: nuevoEstado,
  };

  if (nuevoEstado === "reconocida") {
    actualizacion.reconocidaPor = usuario.uid;
  } else if (nuevoEstado === "resuelta") {
    actualizacion.resueltaPor = usuario.uid;
  }

  await updateDoc(doc(db, COLECCION_ALERTAS, alertaId), actualizacion);
}
