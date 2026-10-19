CREATE TABLE IF NOT EXISTS recompensas_obtenidas (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NOT NULL,
	recompensa_id INT NOT NULL,
	obtenida_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_recompensas_obtenidas_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_recompensas_obtenidas_recompensa
		FOREIGN KEY (recompensa_id) REFERENCES recompensas (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_recompensas_obtenidas_usuario_recompensa (usuario_id, recompensa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
