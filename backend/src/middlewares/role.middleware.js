/**
 * Middleware factory que restringe el acceso a los roles indicados (RF-029).
 * Debe usarse después de authMiddleware, ya que depende de req.user.
 */
export function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ message: "No autorizado." });
		}

		if (!roles.includes(req.user.rol)) {
			return res.status(403).json({ message: "No tenés permisos para acceder a este recurso." });
		}

		return next();
	};
}

export default requireRole;
