CREATE TABLE IF NOT EXISTS actividades_completadas (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NOT NULL,
	actividad_id INT NOT NULL,
	completada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_actividades_completadas_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_actividades_completadas_actividad
		FOREIGN KEY (actividad_id) REFERENCES actividades (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_actividades_completadas_usuario_actividad (usuario_id, actividad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
