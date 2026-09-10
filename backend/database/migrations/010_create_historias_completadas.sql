CREATE TABLE IF NOT EXISTS historias_completadas (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NOT NULL,
	historia_id INT NOT NULL,
	completada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_historias_completadas_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_historias_completadas_historia
		FOREIGN KEY (historia_id) REFERENCES historias (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_historias_completadas_usuario_historia (usuario_id, historia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
