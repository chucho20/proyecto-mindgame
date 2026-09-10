CREATE TABLE IF NOT EXISTS progreso_misiones (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NOT NULL,
	mision_id INT NOT NULL,
	estado ENUM('disponible', 'en_progreso', 'completada') NOT NULL DEFAULT 'en_progreso',
	iniciada_en DATETIME NULL,
	completada_en DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_progreso_misiones_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_progreso_misiones_mision
		FOREIGN KEY (mision_id) REFERENCES misiones (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_progreso_misiones_usuario_mision (usuario_id, mision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
