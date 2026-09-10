CREATE TABLE IF NOT EXISTS retos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	mision_id INT NOT NULL,
	tipo ENUM('seleccion_multiple', 'verdadero_falso', 'relacion_elementos', 'orden_cronologico') NOT NULL,
	enunciado TEXT NOT NULL,
	opciones JSON NULL,
	respuesta_correcta JSON NOT NULL,
	puntos INT NOT NULL DEFAULT 10,
	orden INT NOT NULL DEFAULT 0,
	estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_retos_mision
		FOREIGN KEY (mision_id) REFERENCES misiones (id)
		ON DELETE CASCADE,
	KEY idx_retos_mision_id (mision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
