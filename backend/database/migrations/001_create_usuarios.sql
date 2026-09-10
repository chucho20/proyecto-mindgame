CREATE TABLE IF NOT EXISTS usuarios (
	id INT AUTO_INCREMENT PRIMARY KEY,
	nombre_completo VARCHAR(150) NOT NULL,
	correo VARCHAR(150) NOT NULL,
	nombre_usuario VARCHAR(50) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	edad INT NULL,
	grado_curso VARCHAR(50) NULL,
	rol ENUM('estudiante', 'docente', 'administrador') NOT NULL,
	avatar VARCHAR(100) NULL,
	acepta_tratamiento_datos BOOLEAN NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uq_usuarios_correo (correo),
	UNIQUE KEY uq_usuarios_nombre_usuario (nombre_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
