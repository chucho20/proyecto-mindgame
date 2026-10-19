CREATE TABLE IF NOT EXISTS grupo_estudiantes (
	id INT AUTO_INCREMENT PRIMARY KEY,
	grupo_id INT NOT NULL,
	estudiante_id INT NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_grupo_estudiantes_grupo
		FOREIGN KEY (grupo_id) REFERENCES grupos (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_grupo_estudiantes_estudiante
		FOREIGN KEY (estudiante_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_grupo_estudiantes_grupo_estudiante (grupo_id, estudiante_id),
	KEY idx_grupo_estudiantes_estudiante_id (estudiante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
