-- Las misiones existentes son históricas; el default las deja válidas.
ALTER TABLE misiones
	ADD COLUMN categoria ENUM('historica', 'convivencia') NOT NULL DEFAULT 'historica',
	ADD KEY idx_misiones_categoria (categoria);
