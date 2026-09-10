CREATE TABLE IF NOT EXISTS actividades (
	id INT AUTO_INCREMENT PRIMARY KEY,
	mision_id INT NULL,
	titulo VARCHAR(150) NOT NULL,
	descripcion TEXT NULL,
	tipo VARCHAR(50) NOT NULL,
	orden INT NOT NULL DEFAULT 0,
	estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_actividades_mision
		FOREIGN KEY (mision_id) REFERENCES misiones (id)
		ON DELETE CASCADE,
	KEY idx_actividades_mision_id (mision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
