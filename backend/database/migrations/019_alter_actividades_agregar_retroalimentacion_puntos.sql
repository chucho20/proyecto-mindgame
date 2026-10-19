ALTER TABLE actividades
	ADD COLUMN retroalimentacion TEXT NULL,
	ADD COLUMN puntos INT NOT NULL DEFAULT 0;
