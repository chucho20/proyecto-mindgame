import { collection, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const COLECCION_UMBRALES = "umbrales";

export async function guardarUmbral(umbral) {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Debes iniciar sesión para guardar un umbral.");
  }

  const umbralRef = doc(collection(db, COLECCION_UMBRALES));

  await setDoc(umbralRef, {
    ...umbral,
    actualizadoPor: usuario.uid,
  });

  return umbralRef.id;
}
