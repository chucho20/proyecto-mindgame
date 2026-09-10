import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";

import * as authApi from "../api/auth.api";
import * as profileApi from "../api/profile.api";
import { TOKEN_STORAGE_KEY } from "../api/api";

const AuthContext = createContext(undefined);

function decodeJwt(token) {
	try {
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
		const json = atob(padded);
		return JSON.parse(json);
	} catch {
		return null;
	}
}

/**
 * Provee el estado de autenticación a toda la aplicación: guarda el JWT en
 * localStorage, lo restaura al montar, y expone acciones de login/registro/logout.
 * Se mantiene como .js (no .jsx) por convención del proyecto: usa createElement
 * en lugar de sintaxis JSX.
 */
export function AuthProvider({ children }) {
	const [token, setToken] = useState(null);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function restoreSession() {
			const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

			if (!storedToken || !decodeJwt(storedToken)) {
				if (storedToken) {
					localStorage.removeItem(TOKEN_STORAGE_KEY);
				}
				if (!cancelled) {
					setLoading(false);
				}
				return;
			}

			try {
				const { user: profile } = await profileApi.getProfile();

				if (!cancelled) {
					setToken(storedToken);
					setUser(profile);
				}
			} catch {
				localStorage.removeItem(TOKEN_STORAGE_KEY);

				if (!cancelled) {
					setToken(null);
					setUser(null);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		restoreSession();

		return () => {
			cancelled = true;
		};
	}, []);

	const persistSession = useCallback((newToken, newUser) => {
		localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
		setToken(newToken);
		setUser(newUser);
	}, []);

	const login = useCallback(
		async (correo, password) => {
			const data = await authApi.login({ correo, password });
			persistSession(data.token, data.user);
			return data.user;
		},
		[persistSession],
	);

	const register = useCallback(async (payload) => {
		const data = await authApi.register(payload);
		return data.user;
	}, []);

	const logout = useCallback(async () => {
		try {
			await authApi.logout();
		} catch {
			// Si falla la llamada de red igual limpiamos la sesión local.
		} finally {
			localStorage.removeItem(TOKEN_STORAGE_KEY);
			setToken(null);
			setUser(null);
		}
	}, []);

	const value = {
		user,
		token,
		loading,
		login,
		register,
		logout,
	};

	return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth debe usarse dentro de un AuthProvider.");
	}

	return context;
}

export default AuthContext;
