CREATE TABLE IF NOT EXISTS salas (
	id INT AUTO_INCREMENT PRIMARY KEY,
	codigo VARCHAR(20) NOT NULL,
	actividad_id INT NOT NULL,
	grupo_id INT NOT NULL,
	docente_id INT NOT NULL,
	estado ENUM('esperando', 'en_curso', 'finalizada', 'cerrada') NOT NULL DEFAULT 'esperando',
	capacidad_minima INT NOT NULL DEFAULT 1,
	iniciada_en DATETIME NULL,
	finalizada_en DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_salas_actividad
		FOREIGN KEY (actividad_id) REFERENCES actividades (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_salas_grupo
		FOREIGN KEY (grupo_id) REFERENCES grupos (id)
		ON DELETE CASCADE,
	CONSTRAINT fk_salas_docente
		FOREIGN KEY (docente_id) REFERENCES usuarios (id)
		ON DELETE CASCADE,
	UNIQUE KEY uq_salas_codigo (codigo),
	KEY idx_salas_grupo_estado (grupo_id, estado),
	KEY idx_salas_docente_estado (docente_id, estado),
	KEY idx_salas_actividad_id (actividad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
