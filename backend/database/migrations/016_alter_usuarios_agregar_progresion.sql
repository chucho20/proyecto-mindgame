-- Progresión del estudiante: los usuarios existentes quedan en nivel 1 con 0 puntos.
ALTER TABLE usuarios
	ADD COLUMN puntos_totales INT NOT NULL DEFAULT 0,
	ADD COLUMN nivel_actual INT NOT NULL DEFAULT 1;
