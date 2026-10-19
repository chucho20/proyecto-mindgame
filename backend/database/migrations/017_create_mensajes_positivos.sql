CREATE TABLE IF NOT EXISTS mensajes_positivos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	contenido TEXT NOT NULL,
	contexto VARCHAR(100) NOT NULL,
	estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	KEY idx_mensajes_positivos_contexto_estado (contexto, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
