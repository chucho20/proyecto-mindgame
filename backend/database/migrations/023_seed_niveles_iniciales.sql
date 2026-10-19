-- Niveles iniciales provisionales (mismos valores que database/seeders/002_niveles_seed.js).
-- INSERT IGNORE respeta los niveles ya existentes y no pisa umbrales ajustados por un administrador.
-- ServicioDeProgreso asume que el nivel 1 requiere 0 puntos.
INSERT IGNORE INTO niveles (numero, puntos_requeridos) VALUES
	(1, 0),
	(2, 100),
	(3, 250),
	(4, 500),
	(5, 1000);
