import { createContext, createElement, useContext } from "react";

import { useAuth } from "./AuthContext.js";
import { useSalaTiempoReal } from "../hooks/useSalaTiempoReal.js";

const SalaContext = createContext(undefined);

/**
 * Provee la sala en tiempo real del usuario a toda la aplicación: un único socket por sesión que se
 * conecta recién cuando una pantalla lo pide y se cierra al cerrar sesión. Va dentro de `AuthProvider`
 * (necesita el token y el rol). Se mantiene como .js por la misma convención que `AuthContext`.
 */
export function SalaProvider({ children }) {
	const { token, user } = useAuth();
	const value = useSalaTiempoReal({ token, rol: user?.rol ?? null });

	return createElement(SalaContext.Provider, { value }, children);
}

export function useSala() {
	const context = useContext(SalaContext);

	if (context === undefined) {
		throw new Error("useSala debe usarse dentro de un SalaProvider.");
	}

	return context;
}

export default SalaContext;
