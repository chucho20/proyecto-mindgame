CREATE TABLE IF NOT EXISTS participaciones_grupales (
	id INT AUTO_INCREMENT PRIMARY KEY,
	sala_id INT NOT NULL,
	usuario_id INT NOT NULL,
	estado ENUM('completo', 'abandono') NOT NULL,
	resultado JSON NOT NULL,
	puntos_obtenidos INT NOT NULL DEFAULT 0,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_participaciones_grupales_sala
		FOREIGN KEY (sala_id) REFERENCES salas (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_participaciones_grupales_usuario
		FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_participaciones_grupales_sala_usuario (sala_id, usuario_id),
	KEY idx_participaciones_grupales_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
