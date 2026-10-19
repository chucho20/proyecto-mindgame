CREATE TABLE IF NOT EXISTS recompensas (
	id INT AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(150) NOT NULL,
	descripcion TEXT NULL,
	icono VARCHAR(100) NULL,
	condicion_tipo ENUM('puntos', 'nivel') NOT NULL,
	condicion_valor INT NOT NULL,
	estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	KEY idx_recompensas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
