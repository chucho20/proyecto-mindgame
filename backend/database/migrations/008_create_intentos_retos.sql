CREATE TABLE IF NOT EXISTS intentos_retos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NOT NULL,
	reto_id INT NOT NULL,
	respuesta_dada JSON NOT NULL,
	es_correcto BOOLEAN NOT NULL,
	puntos_obtenidos INT NOT NULL DEFAULT 0,
	resuelto_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_intentos_retos_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_intentos_retos_reto
		FOREIGN KEY (reto_id) REFERENCES retos (id)
		ON DELETE CASCADE,
	KEY idx_intentos_retos_usuario_reto (usuario_id, reto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
