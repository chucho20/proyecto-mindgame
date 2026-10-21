/**
 * Datos de demostración de MindGame (para presentaciones y pruebas manuales).
 *
 * Uso (desde backend/):
 *   npm run db:seed:demo            Carga los datos (idempotente: correrlo dos veces no duplica nada).
 *   npm run db:seed:demo:reset      Elimina SOLO los datos de demostración que crea este archivo.
 *
 * Qué crea: 2 docentes y 8 estudiantes (correos @demo.mindgame.local), 5 misiones (3 históricas y
 * 2 de convivencia, con historias, retos y actividades), 2 actividades para salas en vivo, mensajes
 * positivos, recompensas, logros, 3 grupos con códigos fijos y el progreso de los estudiantes. El progreso
 * NO se inserta a mano: se genera con los mismos servicios que usa la aplicación (responder retos, completar
 * actividades, etc.), así que puntos, niveles, recompensas y logros salen consistentes.
 *
 * Contraseña de las cuentas de demostración: una sola para todas, definida en DEMO_PASSWORD_POR_DEFECTO
 * (más abajo). Se puede cambiar con la variable de entorno DEMO_PASSWORD. También está en docs/GUIA_DEMO.md.
 *
 * Seguridad: se niega a correr con NODE_ENV=production salvo que se pase --force-produccion. Solo agrega
 * filas (nunca modifica ni borra las que ya existían) y el reset solo borra las que este archivo creó
 * (usuarios por dominio de correo; contenido por título/nombre exacto).
 */
import "dotenv/config";

// Contraseña compartida de las cuentas demo (mínimo 8 caracteres, exigido por el registro).
const DEMO_PASSWORD_POR_DEFECTO = "MindGame#Demo2026";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || DEMO_PASSWORD_POR_DEFECTO;
const DOMINIO_DEMO = "@demo.mindgame.local";

const args = new Set(process.argv.slice(2));
const MODO_RESET = args.has("--reset");
const FORZAR_PRODUCCION = args.has("--force-produccion");

// --- Guardia de producción: ANTES de importar nada de src/ (env.js puede abortar en producción) ---

if (process.env.NODE_ENV === "production" && !FORZAR_PRODUCCION) {
	console.error(
		"NODE_ENV=production: el seeder de demostración se niega a correr para no ensuciar datos reales.\n" +
			"Si de verdad es lo que querés, repetí el comando con --force-produccion.",
	);
	process.exit(1);
}

if (DEMO_PASSWORD.length < 8 || DEMO_PASSWORD.length > 72) {
	console.error("DEMO_PASSWORD debe tener entre 8 y 72 caracteres.");
	process.exit(1);
}

// --- Datos: usuarios y grupos ---

const DOCENTES = [
	{ usuario: "docente.ana", nombre: "Ana María Rodríguez", edad: 38, avatar: "avatar-owl" },
	{ usuario: "docente.carlos", nombre: "Carlos Andrés Mendoza", edad: 45, avatar: "avatar-lion" },
];

const ESTUDIANTES = [
	{
		usuario: "estudiante.sofia",
		nombre: "Sofía Ramírez Torres",
		edad: 12,
		grado: "7° A",
		avatar: "avatar-fox",
	},
	{
		usuario: "estudiante.mateo",
		nombre: "Mateo Gómez Vargas",
		edad: 12,
		grado: "7° A",
		avatar: "avatar-panda",
	},
	{
		usuario: "estudiante.camila",
		nombre: "Camila Ortiz Leal",
		edad: 12,
		grado: "7° A",
		avatar: "avatar-monkey",
	},
	{
		usuario: "estudiante.daniel",
		nombre: "Daniel Pineda Soto",
		edad: 12,
		grado: "7° A",
		avatar: "avatar-lion",
	},
	{
		usuario: "estudiante.laura",
		nombre: "Laura Mejía Castro",
		edad: 11,
		grado: "7° A",
		avatar: "avatar-koala",
	},
	{
		usuario: "estudiante.valentina",
		nombre: "Valentina Cruz Pardo",
		edad: 13,
		grado: "8° B",
		avatar: "avatar-tiger",
	},
	{
		usuario: "estudiante.santiago",
		nombre: "Santiago Herrera Díaz",
		edad: 14,
		grado: "8° B",
		avatar: "avatar-frog",
	},
	// Estudiante nuevo: sin progreso y fuera de todo grupo, para mostrar el recorrido desde cero.
	{
		usuario: "estudiante.nicolas",
		nombre: "Nicolás Acosta Rey",
		edad: 12,
		grado: "7° A",
		avatar: "avatar-owl",
	},
];

// Códigos fijos y legibles (alfabeto de los códigos de grupo: sin 0/O ni 1/I/L).
const GRUPOS = [
	{
		codigo: "SABER7",
		docente: "docente.ana",
		nombre: "Ciencias Sociales 7°A",
		miembros: ["sofia", "mateo", "camila", "daniel", "laura"],
	},
	{
		codigo: "PAZ8B2",
		docente: "docente.carlos",
		nombre: "Taller de Convivencia 7°-8°",
		miembros: ["valentina", "santiago", "camila", "daniel", "laura"],
	},
	// Sin estudiantes: sirve para la demostración en vivo de "unirse con código".
	{ codigo: "UNETE2", docente: "docente.ana", nombre: "Club de Historia", miembros: [] },
];

// --- Datos: constructores de retos (formatos exactos que esperan los evaluadores) ---

function seleccion(enunciado, opciones, correcta, puntos, retroalimentacion) {
	const ids = ["a", "b", "c", "d"];
	return {
		tipo: "seleccion_multiple",
		enunciado,
		opciones: opciones.map((texto, i) => ({ id: ids[i], texto })),
		respuestaCorrecta: correcta,
		puntos,
		retroalimentacion,
		incorrecta: ids.find((id) => id !== correcta),
	};
}

function verdaderoFalso(enunciado, correcta, puntos, retroalimentacion) {
	return {
		tipo: "verdadero_falso",
		enunciado,
		opciones: null,
		respuestaCorrecta: correcta,
		puntos,
		retroalimentacion,
		incorrecta: !correcta,
	};
}

// `pares`: { "1": "c", ... } (id izquierdo -> id derecho). Las opciones de la derecha usan ids a, b, c.
function relacion(enunciado, izquierda, derecha, pares, puntos, retroalimentacion) {
	const idsDerecha = ["a", "b", "c", "d"];
	const clavesIzquierda = izquierda.map((_texto, i) => String(i + 1));
	const incorrecta = {
		...pares,
		[clavesIzquierda[0]]: pares[clavesIzquierda[1]],
		[clavesIzquierda[1]]: pares[clavesIzquierda[0]],
	};
	return {
		tipo: "relacion_elementos",
		enunciado,
		opciones: {
			izquierda: izquierda.map((texto, i) => ({ id: clavesIzquierda[i], texto })),
			derecha: derecha.map((texto, i) => ({ id: idsDerecha[i], texto })),
		},
		respuestaCorrecta: pares,
		puntos,
		retroalimentacion,
		incorrecta,
	};
}

// Los textos se pasan en el orden cronológico correcto; el frontend los baraja antes de mostrarlos.
function ordenCronologico(enunciado, textos, puntos, retroalimentacion) {
	const ids = textos.map((_texto, i) => String(i + 1));
	return {
		tipo: "orden_cronologico",
		enunciado,
		opciones: textos.map((texto, i) => ({ id: ids[i], texto })),
		respuestaCorrecta: ids,
		puntos,
		retroalimentacion,
		incorrecta: [...ids].reverse(),
	};
}

// --- Datos: misiones (títulos únicos de la demo; no chocan con las misiones base del proyecto) ---

const MISIONES = [
	{
		clave: "muiscas",
		titulo: "Los Muiscas y la llegada de los españoles",
		descripcion:
			"Conocé a los pueblos originarios del altiplano y cómo cambió su mundo con la fundación de las primeras ciudades.",
		categoria: "historica",
		orden: 3,
		historias: [
			{
				titulo: "El pueblo muisca",
				contenido:
					"Antes de la llegada de los españoles, el altiplano cundiboyacense estaba habitado por los muiscas. Eran agricultores y artesanos que cultivaban maíz y papa y trabajaban el oro y la cerámica. Se organizaban en grandes territorios gobernados por el zipa, en Bacatá, y por el zaque, en Hunza. En la laguna de Guatavita hacían una ceremonia en la que ofrecían objetos de oro a sus dioses; de allí nació la leyenda de El Dorado.",
			},
			{
				titulo: "Nacen las primeras ciudades",
				contenido:
					"Desde 1525 los españoles fundaron ciudades en lo que hoy es Colombia: Santa Marta en 1525 y Cartagena en 1533, en la costa Caribe. El 6 de agosto de 1538, Gonzalo Jiménez de Quesada fundó Santafé, la actual Bogotá, en territorio muisca. Con el tiempo, la Corona española organizó estos territorios y la vida de los pueblos originarios cambió para siempre.",
			},
		],
		retos: [
			seleccion(
				"¿Cómo se llamaba el gobernante muisca de Bacatá?",
				["Zaque", "Zipa", "Cacique Calarcá"],
				"b",
				20,
				"El zipa gobernaba en Bacatá, en la región de la actual Bogotá. El zaque gobernaba en Hunza, la actual Tunja.",
			),
			verdaderoFalso(
				"La ceremonia de la laguna de Guatavita dio origen a la leyenda de El Dorado.",
				true,
				25,
				"Los muiscas ofrecían objetos de oro a sus dioses en la laguna de Guatavita, y los relatos sobre esa ceremonia alimentaron la leyenda de El Dorado.",
			),
			relacion(
				"Relacioná cada fundador con la ciudad que fundó.",
				["Gonzalo Jiménez de Quesada", "Pedro de Heredia", "Rodrigo de Bastidas"],
				["Fundó Cartagena (1533)", "Fundó Santafé de Bogotá (1538)", "Fundó Santa Marta (1525)"],
				{ 1: "b", 2: "a", 3: "c" },
				35,
				"Rodrigo de Bastidas fundó Santa Marta en 1525, Pedro de Heredia fundó Cartagena en 1533 y Gonzalo Jiménez de Quesada fundó Santafé en 1538.",
			),
			ordenCronologico(
				"Ordená las fundaciones desde la más antigua hasta la más reciente.",
				["Fundación de Santa Marta", "Fundación de Cartagena", "Fundación de Santafé de Bogotá"],
				40,
				"Santa Marta (1525), Cartagena (1533) y Santafé de Bogotá (1538): las primeras ciudades se fundaron en la costa y luego en el interior.",
			),
		],
		actividades: [
			{
				titulo: "Crucigrama muisca",
				tipo: "crucigrama",
				puntos: 50,
				descripcion:
					"Resolvé un crucigrama con palabras clave de la cultura muisca: zipa, zaque, Bacatá, Hunza y Guatavita.",
				retroalimentacion:
					"¡Bien hecho! El legado muisca sigue vivo en nombres de lugares como Bogotá, Tunja y Zipaquirá.",
			},
			{
				titulo: "Mapa de las primeras ciudades",
				tipo: "mapa_interactivo",
				puntos: 40,
				descripcion:
					"Ubicá en un mapa de Colombia Santa Marta, Cartagena y Bogotá, y escribí el año de fundación de cada una.",
				retroalimentacion:
					"Las primeras ciudades se fundaron cerca de la costa y de los ríos porque facilitaban la comunicación y el comercio.",
			},
		],
	},
	{
		clave: "comuneros",
		titulo: "El Movimiento Comunero de 1781",
		descripcion:
			"Descubrí cómo los habitantes de El Socorro y de otras villas se unieron para protestar contra los nuevos impuestos.",
		categoria: "historica",
		orden: 4,
		historias: [
			{
				titulo: "Los impuestos que desataron la protesta",
				contenido:
					"En 1781 la Corona española aumentó los impuestos y creó nuevos cobros sobre productos de uso diario, como el tabaco y el aguardiente. Los habitantes de la región, en especial los de la villa de El Socorro, sintieron que la medida los dejaba sin sustento. El 16 de marzo de 1781, Manuela Beltrán, una mujer del pueblo, rompió públicamente el edicto que anunciaba los nuevos impuestos y así comenzó la rebelión.",
			},
			{
				titulo: "La marcha hacia Santafé",
				contenido:
					"Miles de personas, llamadas comuneros, marcharon hacia Santafé al mando de Juan Francisco Berbeo. En Zipaquirá se firmaron las Capitulaciones, que prometían reducir los impuestos, pero la Corona no cumplió todo lo pactado. José Antonio Galán siguió la lucha en defensa de los más humildes y fue ejecutado en 1782. Su historia recuerda el valor de exigir derechos de forma organizada.",
			},
		],
		retos: [
			seleccion(
				"¿Qué provocó la rebelión de los comuneros en 1781?",
				["Un aumento de los impuestos", "La llegada de la imprenta", "El fin de la esclavitud"],
				"a",
				20,
				"La rebelión comenzó como protesta por nuevos impuestos que afectaban la economía de las familias. Fue una de las mayores protestas populares de la época colonial.",
			),
			verdaderoFalso(
				"Manuela Beltrán rompió el edicto de los nuevos impuestos en la villa de El Socorro.",
				true,
				25,
				"El 16 de marzo de 1781 Manuela Beltrán rompió el edicto en El Socorro, y ese gesto se volvió símbolo de la protesta comunera.",
			),
			relacion(
				"Relacioná cada personaje con su papel en el movimiento comunero.",
				["Manuela Beltrán", "Juan Francisco Berbeo", "José Antonio Galán"],
				[
					"Capitán general del movimiento comunero",
					"Rompió el edicto de impuestos en El Socorro",
					"Continuó la lucha después de las Capitulaciones",
				],
				{ 1: "b", 2: "a", 3: "c" },
				35,
				"Beltrán encendió la protesta, Berbeo encabezó la marcha hacia Santafé y Galán siguió la lucha tras las Capitulaciones.",
			),
			ordenCronologico(
				"Ordená estos hechos del movimiento comunero.",
				[
					"Manuela Beltrán rompe el edicto de impuestos (marzo de 1781)",
					"Se firman las Capitulaciones de Zipaquirá (junio de 1781)",
					"Ejecución de José Antonio Galán (febrero de 1782)",
				],
				40,
				"Primero la protesta en El Socorro, luego el acuerdo en Zipaquirá y, al final, el castigo a Galán, cuando la Corona desconoció parte de lo pactado.",
			),
		],
		actividades: [
			{
				titulo: "Obra de teatro comunera",
				tipo: "dramatizacion",
				puntos: 50,
				descripcion:
					"En grupo, representá la escena en la que Manuela Beltrán rompe el edicto y los vecinos del Socorro reaccionan.",
				retroalimentacion:
					"Dramatizar un hecho histórico ayuda a entender cómo se sintieron las personas de esa época y por qué decidieron actuar.",
			},
			{
				titulo: "Línea del tiempo comunera",
				tipo: "linea_de_tiempo",
				puntos: 40,
				descripcion:
					"Dibujá una línea del tiempo con los hechos principales del movimiento comunero y agregá una imagen en cada uno.",
				retroalimentacion:
					"Una línea del tiempo permite ver cómo un hecho conduce al siguiente y entender las causas y consecuencias de la historia.",
			},
		],
	},
	{
		clave: "constitucion",
		titulo: "Colombia y la Constitución de 1991",
		descripcion:
			"Entendé cómo nació la Constitución que hoy protege los derechos de todas las personas en Colombia.",
		categoria: "historica",
		orden: 5,
		historias: [
			{
				titulo: "De la Constitución de 1886 a la de 1991",
				contenido:
					"Durante más de cien años Colombia estuvo regida por la Constitución de 1886. A finales del siglo XX, la sociedad pidió cambios para ampliar los derechos, la participación y la paz. Por eso se eligió una Asamblea Nacional Constituyente, en la que participaron representantes de distintos sectores del país.",
			},
			{
				titulo: "Una Constitución para todos",
				contenido:
					"El 4 de julio de 1991 se proclamó la nueva Constitución Política de Colombia. Definió al país como un Estado social de derecho, reconoció la diversidad étnica y cultural de la nación y creó mecanismos para proteger los derechos, como la acción de tutela, que permite pedir a un juez la protección inmediata de un derecho fundamental.",
			},
		],
		retos: [
			seleccion(
				"¿Qué mecanismo creó la Constitución de 1991 para proteger de forma rápida los derechos fundamentales?",
				["El voto obligatorio", "La acción de tutela", "El servicio militar"],
				"b",
				20,
				"La acción de tutela permite pedir a un juez que proteja un derecho fundamental cuando está siendo vulnerado o amenazado.",
			),
			verdaderoFalso(
				"La Constitución de 1991 reemplazó a la Constitución de 1886.",
				true,
				25,
				"La Constitución de 1886 rigió más de cien años y fue reemplazada por la de 1991, proclamada el 4 de julio de ese año.",
			),
			relacion(
				"Relacioná cada concepto con su significado.",
				["Constitución de 1886", "Asamblea Nacional Constituyente", "Acción de tutela"],
				[
					"Mecanismo para proteger derechos fundamentales",
					"Rigió en Colombia por más de cien años",
					"Redactó la Constitución de 1991",
				],
				{ 1: "b", 2: "c", 3: "a" },
				35,
				"La Constitución de 1886 duró más de un siglo, la Asamblea Constituyente redactó la de 1991 y la tutela protege los derechos fundamentales.",
			),
			ordenCronologico(
				"Ordená las constituciones desde la más antigua hasta la más reciente.",
				["Constitución de Rionegro (1863)", "Constitución de 1886", "Constitución de 1991"],
				40,
				"La Constitución de 1863 dio paso a la de 1886, y esta fue reemplazada por la de 1991, que sigue vigente.",
			),
		],
		actividades: [
			{
				titulo: "Mi derecho en un cartel",
				tipo: "cartel",
				puntos: 50,
				descripcion:
					"Elegí un derecho fundamental (por ejemplo, la educación) y diseñá un cartel que explique por qué es importante para todos.",
				retroalimentacion:
					"Conocer nuestros derechos nos ayuda a exigirlos y a respetar los de los demás: son la base de una convivencia justa.",
			},
			{
				titulo: "Sopa de letras constitucional",
				tipo: "sopa_de_letras",
				puntos: 40,
				descripcion: "Encontrá las palabras: tutela, derechos, constituyente, democracia y participación.",
				retroalimentacion:
					"Estas palabras resumen la idea central de la Constitución de 1991: una democracia donde todas las personas participan y tienen derechos.",
			},
		],
	},
	{
		clave: "acuerdos",
		titulo: "Acuerdos para convivir en el colegio",
		descripcion: "Aprendé a construir un ambiente de respeto, escucha y cuidado entre compañeros.",
		categoria: "convivencia",
		orden: 6,
		historias: [
			{
				titulo: "Convivir es cuidarnos",
				contenido:
					"En el colegio compartimos mucho tiempo con personas distintas: compañeros, profesores y personal de apoyo. Convivir bien significa respetar las diferencias, escuchar con atención, cuidar los espacios comunes y resolver los desacuerdos sin agresiones. Los acuerdos de convivencia, que cada curso construye junto con sus docentes, nos ayudan a que todos nos sintamos seguros y valorados.",
			},
			{
				titulo: "Cuando hay un conflicto",
				contenido:
					"Tener un conflicto es normal: pensamos y sentimos distinto. Lo importante es cómo lo resolvemos. Podemos hacerlo con calma, hablando sin gritar, escuchando la versión del otro y buscando una solución que sirva para ambos. Si no lo logramos solos, pedimos ayuda a un docente o a la persona de orientación escolar.",
			},
		],
		retos: [
			seleccion(
				"Un compañero nuevo llega al curso y está solo en el recreo. ¿Qué es lo más acertado?",
				[
					"Ignorarlo hasta que se acostumbre",
					"Invitarlo a jugar y presentarle al grupo",
					"Burlarse de su acento",
				],
				"b",
				25,
				"Acercarse con amabilidad ayuda a que la persona nueva se sienta parte del grupo. La inclusión empieza con gestos sencillos.",
			),
			verdaderoFalso(
				"Gritar más fuerte que el otro es una buena forma de resolver un conflicto.",
				false,
				25,
				"Gritar aumenta la tensión. Hablar con calma y escuchar permite encontrar acuerdos que sirvan para ambos.",
			),
			relacion(
				"Relacioná cada valor con un ejemplo de la vida escolar.",
				["Respeto", "Solidaridad", "Responsabilidad"],
				[
					"Ayudar a un compañero que no entendió la tarea",
					"Cuidar los útiles y las instalaciones del colegio",
					"Escuchar a quien piensa distinto sin interrumpirlo",
				],
				{ 1: "c", 2: "a", 3: "b" },
				35,
				"El respeto se ve al escuchar, la solidaridad al ayudar y la responsabilidad al cuidar lo que es de todos.",
			),
			ordenCronologico(
				"Ordená los pasos para resolver un conflicto de forma pacífica.",
				[
					"Calmarme y respirar",
					"Escuchar con atención al otro",
					"Proponer soluciones entre los dos",
					"Llegar a un acuerdo y cumplirlo",
				],
				35,
				"Primero nos calmamos, luego escuchamos, después proponemos soluciones y, al final, llegamos a un acuerdo que ambos cumplimos.",
			),
		],
		actividades: [
			{
				titulo: "Cartelera de acuerdos del curso",
				tipo: "cartelera",
				puntos: 50,
				descripcion:
					"Entre todos, escriban cinco acuerdos de convivencia para el curso y decórenlos en una cartelera.",
				retroalimentacion:
					"Los acuerdos construidos entre todos se cumplen mejor, porque cada persona sintió que su voz contó.",
			},
			{
				titulo: "Dinámica del elogio",
				tipo: "dinamica_grupal",
				puntos: 40,
				descripcion:
					"Cada estudiante escribe en un papel una cualidad positiva de un compañero y se la entrega.",
				retroalimentacion:
					"Reconocer lo bueno de los demás fortalece la confianza y hace que el curso sea un lugar más amable.",
			},
		],
	},
	{
		clave: "matoneo",
		titulo: "Alto al matoneo: entre todos cuidamos",
		descripcion: "Reconocé el acoso escolar, aprendé a actuar a tiempo y a apoyar a quien lo necesita.",
		categoria: "convivencia",
		orden: 7,
		historias: [
			{
				titulo: "¿Qué es el matoneo?",
				contenido:
					"El matoneo, también llamado acoso escolar o bullying, ocurre cuando alguien es agredido de forma repetida con palabras, golpes, exclusión o burlas, incluso por redes sociales. No es un juego ni una broma: hace daño a quien lo vive. En Colombia, la Ley 1620 de 2013 creó el Sistema Nacional de Convivencia Escolar para prevenir y atender estas situaciones en los colegios.",
			},
			{
				titulo: "Yo puedo hacer la diferencia",
				contenido:
					"Quien ve una situación de matoneo puede ayudar. Puede acompañar a la persona afectada, no reírse ni reenviar burlas y avisar a un adulto de confianza, como un docente, el coordinador o la persona de orientación. Pedir ayuda no es chismosear: es cuidar a otro y lograr que el colegio actúe a tiempo.",
			},
		],
		retos: [
			seleccion(
				"Ves que un grupo se burla de una compañera todos los días. ¿Qué es lo más acertado?",
				[
					"Reírte para no quedar mal",
					"Acompañarla y contárselo a un docente de confianza",
					"Grabar un video y compartirlo",
				],
				"b",
				25,
				"Acompañar a la persona afectada y avisar a un adulto de confianza ayuda a frenar el matoneo a tiempo.",
			),
			verdaderoFalso(
				"Reenviar una burla sobre un compañero por redes sociales no es matoneo si yo no la creé.",
				false,
				25,
				"Compartir contenido que humilla a alguien también es participar en el acoso y aumenta el daño.",
			),
			relacion(
				"Relacioná cada situación con lo que representa.",
				[
					"Burlas y apodos ofensivos",
					"Dejar a alguien fuera del grupo a propósito",
					"Defender a quien está siendo agredido",
				],
				["Exclusión social", "Conducta solidaria", "Agresión verbal"],
				{ 1: "c", 2: "a", 3: "b" },
				35,
				"Las burlas son agresión verbal, dejar a alguien fuera es exclusión social y defender a quien lo necesita es una conducta solidaria.",
			),
			ordenCronologico(
				"Ordená los pasos para actuar ante una situación de matoneo.",
				[
					"Reconocer que lo que ocurre no es un juego",
					"Acompañar a la persona afectada",
					"Avisar a un adulto de confianza",
					"Hacer seguimiento para que el apoyo continúe",
				],
				35,
				"Reconocer el problema es el primer paso; luego acompañamos, pedimos ayuda y nos aseguramos de que el apoyo continúe.",
			),
		],
		actividades: [
			{
				titulo: "Mural contra el matoneo",
				tipo: "mural",
				puntos: 50,
				descripcion:
					"Creen un mural con frases y dibujos que inviten a cuidarse y a rechazar el matoneo, y expónganlo en el colegio.",
				retroalimentacion:
					"Un mensaje visible en el colegio recuerda a todos que el respeto es una responsabilidad compartida.",
			},
			{
				titulo: "Juego de roles: ¿qué haría yo?",
				tipo: "juego_de_roles",
				puntos: 40,
				descripcion:
					"En grupos pequeños, representen una situación de matoneo y practiquen cómo apoyar a la persona afectada y pedir ayuda.",
				retroalimentacion:
					"Practicar cómo reaccionar nos prepara para actuar con seguridad y empatía cuando la situación sea real.",
			},
		],
	},
];

// Actividades sin misión: sirven para las salas en vivo. Nadie las completa en la siembra, así que los
// puntos se ven por primera vez al terminar la sala (completar una actividad solo suma una vez por usuario).
const ACTIVIDADES_EN_VIVO = [
	{
		titulo: "Debate en equipo: el semáforo de la convivencia",
		tipo: "actividad_grupal",
		puntos: 30,
		descripcion:
			"Actividad grupal en tiempo real. El docente plantea una situación del colegio (por ejemplo, un desacuerdo por el uso de la cancha). Cada estudiante propone una solución y, entre todos, las clasifican con un semáforo: verde si respeta a todos, amarillo si se puede mejorar y rojo si genera más conflicto. Al final, el grupo acuerda una solución común.",
		retroalimentacion:
			"Trabajar en equipo permite ver un problema desde varios puntos de vista y construir soluciones que cuiden a todos.",
	},
	{
		titulo: "Línea del tiempo colaborativa de Colombia",
		tipo: "actividad_grupal",
		puntos: 30,
		descripcion:
			"Actividad grupal en tiempo real. Entre todos ordenan los hitos de la historia de Colombia que estudiaron (los muiscas, las primeras ciudades, los comuneros, la Independencia y la Constitución de 1991). Cada estudiante propone en qué lugar va un hito y el grupo discute hasta ponerse de acuerdo.",
		retroalimentacion:
			"Ordenar la historia entre todos ayuda a entender causas y consecuencias, y a respetar las ideas de los demás.",
	},
];

const MENSAJES_POSITIVOS = [
	["reto_completado", "¡Excelente trabajo! Respetar y escuchar a los demás hace más fuerte a todo el grupo."],
	["reto_completado", "¡Muy bien! Cada vez que elegís el diálogo, tu colegio se vuelve un lugar más amable."],
	["reto_completado", "¡Bravo! Pensar antes de actuar es una gran muestra de respeto y empatía."],
	["actividad_completada", "¡Gran actividad! Trabajar juntos nos ayuda a construir confianza y amistad."],
	["actividad_completada", "¡Lo lograste! Compartir con tus compañeros hace que todos aprendamos más."],
	[
		"actividad_completada",
		"¡Felicitaciones! Tu participación aporta a una convivencia más amable en el colegio.",
	],
];

// Umbrales de los niveles base: 0, 100, 250, 500 y 1000 puntos. La demo suma 1050 puntos en misiones,
// así que se puede llegar al nivel máximo.
const RECOMPENSAS = [
	{
		nombre: "Insignia de Explorador",
		icono: "🧭",
		tipo: "puntos",
		valor: 50,
		descripcion: "Por dar tus primeros pasos en MindGame.",
	},
	{
		nombre: "Pergamino del Historiador",
		icono: "📜",
		tipo: "puntos",
		valor: 150,
		descripcion: "Por sumar 150 puntos aprendiendo historia.",
	},
	{ nombre: "Medalla de Plata", icono: "🥈", tipo: "nivel", valor: 3, descripcion: "Por llegar al nivel 3." },
	{
		nombre: "Escudo de la Convivencia",
		icono: "🛡️",
		tipo: "nivel",
		valor: 4,
		descripcion: "Por llegar al nivel 4 cuidando a los demás.",
	},
	{
		nombre: "Trofeo del Libertador",
		icono: "🏆",
		tipo: "nivel",
		valor: 5,
		descripcion: "Por alcanzar el nivel máximo.",
	},
];

const LOGROS = [
	{
		nombre: "Primer paso",
		icono: "🚀",
		tipo: "puntos",
		valor: 20,
		descripcion: "Sumá tus primeros 20 puntos.",
	},
	{ nombre: "Mente curiosa", icono: "🔎", tipo: "nivel", valor: 2, descripcion: "Llegá al nivel 2." },
	{ nombre: "Constructor de paz", icono: "🕊️", tipo: "puntos", valor: 300, descripcion: "Sumá 300 puntos." },
	{
		nombre: "Historiador en formación",
		icono: "📚",
		tipo: "puntos",
		valor: 500,
		descripcion: "Sumá 500 puntos.",
	},
	{
		nombre: "Maestro de MindGame",
		icono: "🎓",
		tipo: "nivel",
		valor: 5,
		descripcion: "Llegá al nivel máximo.",
	},
];

// --- Datos: progreso de cada estudiante ---
// `retos: n` = responde bien los primeros n retos de la misión; `fallos: { indice: cantidad }` = intentos
// incorrectos antes del acierto; `historias`/`actividades` = cuántas completa (en orden).
// Puntos esperados (por misión completa: 210): sofía 1050 (nivel 5), mateo 680 (4), valentina 550 (4),
// camila 315 (3), santiago 295 (3), daniel 130 (2), laura 45 (1), nicolás 0.

const PROGRESO = {
	sofia: [
		{ mision: "muiscas", historias: 2, retos: 4, actividades: 2, fallos: { 0: 1, 3: 1 } },
		{ mision: "comuneros", historias: 2, retos: 4, actividades: 2, fallos: { 2: 1 } },
		{ mision: "constitucion", historias: 2, retos: 4, actividades: 2, fallos: {} },
		{ mision: "acuerdos", historias: 2, retos: 4, actividades: 2, fallos: { 2: 1 } },
		{ mision: "matoneo", historias: 2, retos: 4, actividades: 2, fallos: { 1: 1 } },
	],
	mateo: [
		{ mision: "muiscas", historias: 2, retos: 4, actividades: 2, fallos: { 1: 1 } },
		{ mision: "comuneros", historias: 2, retos: 4, actividades: 2, fallos: { 2: 1 } },
		{ mision: "acuerdos", historias: 2, retos: 4, actividades: 2, fallos: {} },
		{ mision: "matoneo", historias: 1, retos: 2, actividades: 0, fallos: { 0: 1 } },
	],
	valentina: [
		{ mision: "muiscas", historias: 2, retos: 4, actividades: 2, fallos: { 1: 1 } },
		{ mision: "acuerdos", historias: 2, retos: 4, actividades: 2, fallos: { 3: 2 } },
		{ mision: "comuneros", historias: 1, retos: 3, actividades: 1, fallos: {} },
	],
	camila: [
		{ mision: "acuerdos", historias: 2, retos: 4, actividades: 2, fallos: { 0: 1 } },
		{ mision: "matoneo", historias: 1, retos: 3, actividades: 0, fallos: { 2: 1 } },
		{ mision: "muiscas", historias: 1, retos: 1, actividades: 0, fallos: {} },
	],
	santiago: [
		{ mision: "muiscas", historias: 2, retos: 4, actividades: 2, fallos: { 2: 1 } },
		{ mision: "acuerdos", historias: 2, retos: 3, actividades: 0, fallos: {} },
	],
	daniel: [{ mision: "muiscas", historias: 1, retos: 3, actividades: 1, fallos: { 2: 2 } }],
	laura: [{ mision: "muiscas", historias: 1, retos: 2, actividades: 0, fallos: { 0: 1, 1: 2 } }],
	nicolas: [],
};

// --- Ejecución ---

const destino = `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
console.log(
	MODO_RESET
		? `[demo] Va a ELIMINAR los datos de demostración en ${destino} (solo los que creó este seeder).`
		: `[demo] Va a cargar los datos de demostración en ${destino} (solo agrega: no modifica ni borra filas existentes).`,
);

const { default: prisma } = await import("../../src/config/prisma.js");

const usuarioRepository = await import("../../src/repositories/usuario.repository.js");
const grupoRepository = await import("../../src/repositories/grupo.repository.js");
const { hashPassword } = await import("../../src/utils/password.util.js");
const misionService = await import("../../src/services/mision.service.js");
const historiaService = await import("../../src/services/historia.service.js");
const retoService = await import("../../src/services/reto.service.js");
const actividadService = await import("../../src/services/actividad.service.js");
const mensajePositivoService = await import("../../src/services/mensajePositivo.service.js");
const recompensaService = await import("../../src/services/recompensa.service.js");
const logroService = await import("../../src/services/logro.service.js");
const grupoService = await import("../../src/services/grupo.service.js");
const progresoService = await import("../../src/services/progreso.service.js");

const correoDe = (usuario) => `${usuario}${DOMINIO_DEMO}`;
const resumen = {};
const contar = (clave, creado) => {
	resumen[clave] ??= { creados: 0, existentes: 0 };
	resumen[clave][creado ? "creados" : "existentes"] += 1;
};
let accionesDeProgreso = 0;

// --- Reset ---

async function reiniciar() {
	const titulosMisiones = MISIONES.map((mision) => mision.titulo);
	const titulosEnVivo = ACTIVIDADES_EN_VIVO.map((actividad) => actividad.titulo);

	// Aviso: cuentas que no son de demo y jugaron contenido de demo. Al borrar el contenido se borra su
	// historial de esos retos, pero sus puntos totales no se revierten.
	const ajenos = await prisma.usuario.count({
		where: {
			NOT: { correo: { endsWith: DOMINIO_DEMO } },
			OR: [
				{ intentosRetos: { some: { reto: { mision: { titulo: { in: titulosMisiones } } } } } },
				{ actividadesCompletadas: { some: { actividad: { titulo: { in: [...titulosEnVivo] } } } } },
			],
		},
	});

	if (ajenos > 0) {
		console.warn(
			`[demo] Aviso: ${ajenos} cuenta(s) que no son de demo jugaron contenido de demo. Se borra su historial de ese contenido, pero sus puntos totales se conservan.`,
		);
	}

	const borrados = await prisma.$transaction(async (tx) => {
		const usuarios = await tx.usuario.deleteMany({
			where: { correo: { endsWith: DOMINIO_DEMO }, rol: { in: ["estudiante", "docente"] } },
		});
		const misiones = await tx.mision.deleteMany({ where: { titulo: { in: titulosMisiones } } });
		const enVivo = await tx.actividad.deleteMany({
			where: { misionId: null, titulo: { in: titulosEnVivo } },
		});
		const mensajes = await tx.mensajePositivo.deleteMany({
			where: { OR: MENSAJES_POSITIVOS.map(([contexto, contenido]) => ({ contexto, contenido })) },
		});
		const recompensas = await tx.recompensa.deleteMany({
			where: { nombre: { in: RECOMPENSAS.map((item) => item.nombre) } },
		});
		const logros = await tx.logro.deleteMany({
			where: { nombre: { in: LOGROS.map((item) => item.nombre) } },
		});

		return {
			usuarios: usuarios.count,
			misiones: misiones.count,
			actividades_en_vivo: enVivo.count,
			mensajes_positivos: mensajes.count,
			recompensas: recompensas.count,
			logros: logros.count,
		};
	});

	console.log("[demo] Eliminado (con lo que cae en cascada: grupos, progreso, historias, retos, etc.):");
	console.table(borrados);
}

// --- Carga ---

async function asegurarUsuario({ usuario, nombre, edad, grado, avatar, rol }) {
	const correo = correoDe(usuario);
	const existente = await usuarioRepository.findByEmail(correo);

	if (existente) {
		contar(`usuarios (${rol})`, false);
		return existente;
	}

	if (await usuarioRepository.findByUsername(usuario)) {
		throw new Error(`El nombre de usuario "${usuario}" ya lo usa una cuenta que no es de demostración.`);
	}

	const creado = await usuarioRepository.create({
		nombreCompleto: nombre,
		correo,
		nombreUsuario: usuario,
		passwordHash: await hashPassword(DEMO_PASSWORD),
		edad,
		gradoCurso: grado ?? null,
		rol,
		avatar,
		aceptaTratamientoDatos: true,
	});
	contar(`usuarios (${rol})`, true);
	return creado;
}

// Busca por clave natural y crea solo si falta. `buscar` devuelve la fila o null; `crear` la crea.
async function asegurar(clave, buscar, crear) {
	const existente = await buscar();

	if (existente) {
		contar(clave, false);
		return existente;
	}

	const creado = await crear();
	contar(clave, true);
	return creado;
}

async function asegurarMision(definicion) {
	const mision = await asegurar(
		"misiones",
		() => prisma.mision.findFirst({ where: { titulo: definicion.titulo } }),
		() =>
			misionService.crear({
				titulo: definicion.titulo,
				descripcion: definicion.descripcion,
				orden: definicion.orden,
				categoria: definicion.categoria,
			}),
	);
	const misionId = mision.id;
	const retos = [];
	const actividades = [];
	const historias = [];

	for (const [i, historia] of definicion.historias.entries()) {
		historias.push(
			await asegurar(
				"historias",
				() => prisma.historia.findFirst({ where: { misionId, titulo: historia.titulo } }),
				() => historiaService.crear({ misionId, ...historia, orden: i + 1 }),
			),
		);
	}

	for (const [i, item] of definicion.retos.entries()) {
		const { incorrecta, ...datos } = item;
		const fila = await asegurar(
			"retos",
			() => prisma.reto.findFirst({ where: { misionId, enunciado: datos.enunciado } }),
			() => retoService.crear({ misionId, ...datos, orden: i + 1 }),
		);
		retos.push({
			id: fila.id,
			puntos: datos.puntos,
			tipo: datos.tipo,
			correcta: datos.respuestaCorrecta,
			incorrecta,
		});
	}

	for (const [i, actividad] of definicion.actividades.entries()) {
		actividades.push(
			await asegurar(
				"actividades",
				() => prisma.actividad.findFirst({ where: { misionId, titulo: actividad.titulo } }),
				() => actividadService.crear({ misionId, ...actividad, orden: i + 1 }),
			),
		);
	}

	return { id: misionId, historias, retos, actividades };
}

async function cargarContenido() {
	const misiones = {};

	for (const definicion of MISIONES) {
		misiones[definicion.clave] = await asegurarMision(definicion);
	}

	for (const actividad of ACTIVIDADES_EN_VIVO) {
		await asegurar(
			"actividades para salas en vivo",
			() => prisma.actividad.findFirst({ where: { misionId: null, titulo: actividad.titulo } }),
			() => actividadService.crear({ misionId: null, ...actividad, orden: 0 }),
		);
	}

	for (const [contexto, contenido] of MENSAJES_POSITIVOS) {
		await asegurar(
			"mensajes positivos",
			() => prisma.mensajePositivo.findFirst({ where: { contexto, contenido } }),
			() => mensajePositivoService.crear({ contexto, contenido }),
		);
	}

	for (const item of RECOMPENSAS) {
		await asegurar(
			"recompensas",
			() => prisma.recompensa.findFirst({ where: { nombre: item.nombre } }),
			() =>
				recompensaService.crear({
					nombre: item.nombre,
					descripcion: item.descripcion,
					icono: item.icono,
					condicion_tipo: item.tipo,
					condicion_valor: item.valor,
				}),
		);
	}

	for (const item of LOGROS) {
		await asegurar(
			"logros",
			() => prisma.logro.findFirst({ where: { nombre: item.nombre } }),
			() =>
				logroService.crear({
					nombre: item.nombre,
					descripcion: item.descripcion,
					icono: item.icono,
					condicion_tipo: item.tipo,
					condicion_valor: item.valor,
				}),
		);
	}

	return misiones;
}

// Respuesta incorrecta conocida del reto, o la correcta, según corresponda.
async function responderReto(usuarioId, reto, { correcta }) {
	const respuesta = correcta ? reto.correcta : reto.incorrecta;
	await retoService.responder(reto.id, usuarioId, respuesta);
	accionesDeProgreso += 1;
}

// Genera el avance de un estudiante con los servicios reales. Cada paso se salta si ya está hecho, así que
// volver a correr el seeder no repite intentos ni suma nada.
async function generarProgreso(usuarioId, pasos, misiones) {
	for (const paso of pasos) {
		const mision = misiones[paso.mision];

		await misionService.iniciar(mision.id, usuarioId);

		for (const historia of mision.historias.slice(0, paso.historias)) {
			const hecha = await prisma.historiaCompletada.findFirst({
				where: { usuarioId, historiaId: historia.id },
			});
			if (!hecha) {
				await historiaService.marcarCompletada(historia.id, usuarioId);
				accionesDeProgreso += 1;
			}
		}

		for (const [indice, reto] of mision.retos.slice(0, paso.retos).entries()) {
			const intentos = await prisma.intentoReto.findMany({ where: { usuarioId, retoId: reto.id } });

			if (intentos.some((intento) => intento.esCorrecto)) {
				continue;
			}

			const fallosPendientes = (paso.fallos[indice] ?? 0) - intentos.length;
			for (let i = 0; i < fallosPendientes; i += 1) {
				await responderReto(usuarioId, reto, { correcta: false });
			}

			await responderReto(usuarioId, reto, { correcta: true });
		}

		for (const actividad of mision.actividades.slice(0, paso.actividades)) {
			const hecha = await prisma.actividadCompletada.findFirst({
				where: { usuarioId, actividadId: actividad.id },
			});
			if (!hecha) {
				await actividadService.completar(actividad.id, usuarioId);
				accionesDeProgreso += 1;
			}
		}
	}

	// Deja nivel, recompensas y logros al día (idempotente; el nivel nunca baja).
	await progresoService.reevaluarProgresion(usuarioId);
}

async function cargar() {
	const misiones = await cargarContenido();
	const usuarios = {};

	for (const docente of DOCENTES) {
		usuarios[docente.usuario] = await asegurarUsuario({ ...docente, rol: "docente" });
	}

	for (const estudiante of ESTUDIANTES) {
		usuarios[estudiante.usuario] = await asegurarUsuario({ ...estudiante, rol: "estudiante" });
	}

	for (const definicion of GRUPOS) {
		const docente = usuarios[definicion.docente];
		const grupo = await asegurar(
			"grupos",
			() => grupoRepository.findByCodigo(definicion.codigo),
			() =>
				grupoRepository.create({
					docenteId: docente.id,
					nombre: definicion.nombre,
					codigo: definicion.codigo,
				}),
		);

		if (grupo.docente_id !== docente.id) {
			throw new Error(`El código ${definicion.codigo} ya lo usa un grupo que no es de demostración.`);
		}

		for (const miembro of definicion.miembros) {
			const { ya_pertenecia: yaPertenecia } = await grupoService.unirseConCodigo(
				usuarios[`estudiante.${miembro}`].id,
				{ codigo: definicion.codigo },
			);
			contar("miembros de grupos", !yaPertenecia);
		}
	}

	for (const [nombre, pasos] of Object.entries(PROGRESO)) {
		await generarProgreso(usuarios[`estudiante.${nombre}`].id, pasos, misiones);
	}

	return usuarios;
}

// --- Verificación de consistencia (se imprime y define el código de salida) ---

async function verificar() {
	const niveles = await prisma.nivel.findMany({ orderBy: { numero: "asc" } });
	const nivelPara = (puntos) =>
		Math.max(...niveles.filter((nivel) => puntos >= nivel.puntosRequeridos).map((nivel) => nivel.numero));
	const estudiantes = await prisma.usuario.findMany({
		where: { correo: { endsWith: DOMINIO_DEMO }, rol: "estudiante" },
		orderBy: { id: "asc" },
		include: {
			intentosRetos: true,
			actividadesCompletadas: { include: { actividad: true } },
			_count: { select: { recompensasObtenidas: true, logrosObtenidos: true, gruposEstudiante: true } },
			progresoMisiones: true,
		},
	});
	const filas = [];
	let problemas = 0;

	for (const estudiante of estudiantes) {
		const porRetos = estudiante.intentosRetos.reduce((total, intento) => total + intento.puntosObtenidos, 0);
		const porActividades = estudiante.actividadesCompletadas.reduce(
			(total, completada) => total + completada.actividad.puntos,
			0,
		);
		const sumaCorrecta = porRetos + porActividades === estudiante.puntosTotales;
		const nivelCorrecto = nivelPara(estudiante.puntosTotales) === estudiante.nivelActual;

		if (!sumaCorrecta || !nivelCorrecto) {
			problemas += 1;
		}

		filas.push({
			usuario: estudiante.nombreUsuario,
			puntos: estudiante.puntosTotales,
			nivel: estudiante.nivelActual,
			"misiones completadas": estudiante.progresoMisiones.filter((p) => p.estado === "completada").length,
			intentos: estudiante.intentosRetos.length,
			recompensas: estudiante._count.recompensasObtenidas,
			logros: estudiante._count.logrosObtenidos,
			grupos: estudiante._count.gruposEstudiante,
			consistente: sumaCorrecta && nivelCorrecto ? "sí" : "NO",
		});
	}

	console.log(
		"\n[demo] Estudiantes de demostración (puntos = suma de retos + actividades; nivel según umbrales):",
	);
	console.table(filas);
	return problemas;
}

async function imprimirResultado() {
	const totalCreados = Object.values(resumen).reduce((total, item) => total + item.creados, 0);

	if (totalCreados === 0 && accionesDeProgreso === 0) {
		console.log("[demo] Nada nuevo: los datos de demostración ya estaban cargados.");
	} else {
		console.log("[demo] Resultado (creados / ya existían):");
		console.table(
			Object.fromEntries(
				Object.entries(resumen).map(([clave, item]) => [
					clave,
					{ creados: item.creados, existentes: item.existentes },
				]),
			),
		);
		console.log(`[demo] Acciones de progreso ejecutadas con los servicios reales: ${accionesDeProgreso}.`);
	}

	const grupos = await prisma.grupo.findMany({
		where: { codigo: { in: GRUPOS.map((grupo) => grupo.codigo) } },
		include: { docente: { select: { nombreUsuario: true } }, _count: { select: { estudiantes: true } } },
		orderBy: { id: "asc" },
	});
	console.log("\n[demo] Códigos de grupo:");
	console.table(
		grupos.map((grupo) => ({
			codigo: grupo.codigo,
			grupo: grupo.nombre,
			docente: grupo.docente.nombreUsuario,
			estudiantes: grupo._count.estudiantes,
		})),
	);
	console.log(
		`[demo] Cuentas: ${DOCENTES.length} docentes y ${ESTUDIANTES.length} estudiantes con correo <usuario>${DOMINIO_DEMO}; ` +
			"contraseña compartida: ver DEMO_PASSWORD_POR_DEFECTO en este archivo o docs/GUIA_DEMO.md.",
	);
}

let codigoDeSalida = 0;

try {
	if (MODO_RESET) {
		await reiniciar();
	} else {
		await cargar();
		await imprimirResultado();
		const problemas = await verificar();

		if (problemas > 0) {
			console.error(`[demo] ${problemas} estudiante(s) con puntos o nivel inconsistentes. Revisá la tabla.`);
			codigoDeSalida = 1;
		} else {
			console.log("[demo] Verificación de consistencia: correcta.");
		}
	}
} catch (error) {
	console.error("[demo] Error al ejecutar el seed de demostración:", error.message);
	codigoDeSalida = 1;
} finally {
	await prisma.$disconnect();
}

process.exit(codigoDeSalida);
