CREATE TABLE IF NOT EXISTS logros_obtenidos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NOT NULL,
	logro_id INT NOT NULL,
	obtenido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_logros_obtenidos_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_logros_obtenidos_logro
		FOREIGN KEY (logro_id) REFERENCES logros (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_logros_obtenidos_usuario_logro (usuario_id, logro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
