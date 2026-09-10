ESPECIFICACIÓN DE REQUISITOS DE SOFTWARE (ERS)
Proyecto: MindGame
Tipo de aplicación: Videojuego educativo e interactivo — Aplicación web responsive
Versión del documento: 1.2
Fecha: 7 de septiembre de 2026
Estado: Borrador para validación de requisitos
Metodología de referencia: IEEE 830 / ISO/IEC/IEEE 29148
Nota de versión 1.2: esta ERS reemplaza la versión 1.0 (orientada a aplicación móvil nativa). El proyecto MindGame se redefine como aplicación web responsive, ejecutable desde navegador en computadores, tablets y teléfonos. Se resolvieron tres decisiones pendientes de la v1.0: (1) actividades grupales = multiusuario en tiempo real, (2) rol docente = rol independiente con acceso a estadísticas, (3) modo sin conexión = fuera del MVP, diferido a v2.0.
# 1. Introducción
## 1.1 Propósito
El presente documento especifica los requisitos funcionales, no funcionales, de interfaz y de comportamiento de MindGame, un videojuego educativo e interactivo desarrollado como aplicación web responsive, orientado principalmente a estudiantes y jóvenes, con un rol docente complementario.
La finalidad de esta Especificación de Requisitos de Software (ERS) es establecer de manera clara, verificable y trazable qué debe hacer el sistema, cuáles son sus restricciones y qué características de calidad debe cumplir.
El documento servirá como referencia para:
Analizar y validar las necesidades de los usuarios.
Orientar el diseño y desarrollo de la aplicación.
Definir las funcionalidades que serán implementadas.
Facilitar las pruebas y validación del producto.
Controlar cambios futuros en los requisitos.
Establecer una relación entre los objetivos del proyecto y los requisitos del sistema.
La estructura toma como referencia las prácticas tradicionales de especificación de requisitos de IEEE 830-1998 y el enfoque vigente de ingeniería de requisitos de ISO/IEC/IEEE 29148:2018. IEEE 830-1998 es actualmente un estándar sustituido, mientras que ISO/IEC/IEEE 29148:2018 constituye la referencia internacional vigente para ingeniería de requisitos, aunque ISO indica que dicha edición se encuentra en proceso de revisión.
## 1.2 Alcance
### 1.2.1 Alcance del producto
MindGame será una aplicación web responsive de carácter educativo, recreativo e interactivo, accesible desde navegador en computadores de escritorio, portátiles, tablets y teléfonos móviles, que permitirá a los usuarios aprender y reforzar conocimientos mediante:
Misiones relacionadas con historias y contenidos históricos.
Retos y preguntas.
Actividades recreativas.
Actividades relacionadas con convivencia, incluyendo actividades grupales en tiempo real.
Contenidos orientados al respeto, empatía y trabajo en equipo.
Mensajes positivos.
Sistema de puntos y recompensas.
Progresión mediante niveles.
Consulta del progreso.
Retroalimentación sobre las actividades realizadas.
Logros.
Un rol docente con acceso a estadísticas de sus estudiantes.
El usuario comenzará con un nivel inicial y podrá progresar conforme complete las diferentes actividades y obtenga puntos.
### 1.2.2 Usuarios objetivo
El producto está dirigido principalmente a:
Estudiantes, especialmente jóvenes.
Docentes, con un rol independiente para el seguimiento del progreso de sus estudiantes.
### 1.2.3 Elementos incluidos
El sistema incluirá:
Registro e inicio de sesión.
Recuperación de contraseña.
Gestión y personalización del perfil.
Exploración del contenido del videojuego.
Misiones históricas.
Retos relacionados con historias y conocimientos.
Actividades recreativas.
Misiones relacionadas con convivencia.
Actividades grupales multiusuario en tiempo real.
Mensajes positivos.
Puntos, recompensas y niveles.
Consulta del progreso.
Retroalimentación.
Logros.
Cierre de sesión.
Rol docente: gestión de grupos y consulta de estadísticas de estudiantes.
Funcionalidades administrativas para gestionar los contenidos del juego.
### 1.2.4 Elementos excluidos
El sistema no:
Reemplazará la educación formal.
Reemplazará las clases de historia.
Funcionará como servicio profesional de atención psicológica.
Realizará diagnósticos sobre el estado emocional de los usuarios.
Pretenderá emitir conclusiones clínicas o médicas sobre los usuarios.
Ofrecerá funcionamiento sin conexión a Internet en el MVP (ver sección 6, alcance v2.0).
Se distribuirá como aplicación nativa de Android o iOS en el MVP (ver sección 6).
## 1.3 Definiciones, acrónimos y abreviaturas
## 1.4 Referencias
ISO/IEC/IEEE 29148:2018, Systems and software engineering — Life cycle processes — Requirements engineering. Esta norma define procesos, información y orientación para la ingeniería de requisitos durante el ciclo de vida de sistemas y software.
IEEE 830-1998, IEEE Recommended Practice for Software Requirements Specifications. Documento histórico utilizado como referencia para la estructura y características de una especificación de requisitos. IEEE señala que fue sustituido por ISO/IEC/IEEE 29148.
Ley 1581 de 2012 (Colombia), Régimen General de Protección de Datos Personales, aplicable dado que el sistema trata datos personales de menores de edad.
Información y necesidades del proyecto proporcionadas por el solicitante de la aplicación MindGame, incluyendo las decisiones tomadas para la versión 1.2 (web responsive).
# 2. Descripción general
## 2.1 Perspectiva del producto
MindGame será una aplicación web responsive orientada al aprendizaje mediante dinámicas propias de un videojuego, accesible desde navegador sin necesidad de instalación.
El producto combinará tres componentes principales:
Componente educativo: historias, retos y actividades para reforzar conocimientos.
Componente recreativo: dinámicas interactivas, incluyendo actividades grupales en tiempo real, destinadas a hacer más entretenido el proceso de aprendizaje.
Componente de convivencia y bienestar: actividades orientadas al respeto, empatía, colaboración, trabajo en equipo y sana convivencia.
El sistema estará compuesto conceptualmente por:
Módulo de autenticación (estudiante, docente, administrador).
Módulo de perfiles.
Módulo de contenido y misiones.
Módulo de retos.
Módulo de actividades recreativas.
Módulo de convivencia y actividades grupales en tiempo real.
Módulo de puntuación y progresión.
Módulo de logros y recompensas.
Módulo de progreso y retroalimentación.
Módulo docente (grupos y estadísticas).
Módulo administrativo.
No se han definido tecnologías específicas, bases de datos, arquitectura ni servicios de alojamiento. Estos elementos deberán definirse durante las etapas de diseño técnico (SDD).
## 2.2 Funciones del producto
Las funciones principales serán:
### Gestión de usuarios
Registro.
Inicio de sesión.
Recuperación de contraseña.
Cierre de sesión.
Gestión del perfil.
Personalización del perfil.
### Gestión del juego
Visualización del contenido disponible.
Exploración de misiones.
Selección de misiones.
Ejecución de retos.
Realización de actividades.
Finalización de misiones.
### Aprendizaje histórico
Presentación de historias.
Presentación de contenidos históricos.
Retos relacionados con los contenidos.
Evaluación de respuestas.
Retroalimentación.
### Convivencia y bienestar
Misiones de convivencia.
Actividades sobre respeto.
Actividades sobre empatía.
Actividades sobre colaboración.
Actividades sobre trabajo en equipo.
Mensajes positivos.
Actividades recreativas.
### Progresión
Obtención de puntos.
Obtención de recompensas.
Desbloqueo de niveles.
Consulta del progreso.
Consulta de logros.
### Actividades grupales en tiempo real
Creación o ingreso a una sala de actividad grupal.
Espera y visualización de participantes conectados.
Participación sincronizada en la dinámica colaborativa.
Registro del resultado de la actividad cuando corresponda.
### Rol docente
Inicio de sesión como docente.
Creación y gestión de grupos de estudiantes.
Consulta de estadísticas de progreso por estudiante y por grupo.
### Administración
Gestión de usuarios, según los permisos establecidos.
Creación, modificación, activación o desactivación de misiones.
Gestión de retos.
Gestión de contenidos históricos.
Gestión de actividades recreativas.
Gestión de contenidos de convivencia.
Gestión de recompensas, niveles y logros.
Nota:
• Las funciones administrativas no fueron detalladas completamente en la información inicial. Por ello, los requisitos administrativos incluidos en esta ERS deberán validarse con el responsable del proyecto.
## 2.3 Características de los usuarios
### 2.3.1 Usuario/estudiante
Perfil principal del sistema.
Características:
Puede tener conocimientos tecnológicos básicos.
Utiliza principalmente navegador web, desde computador, tablet o teléfono móvil.
Busca aprender de manera entretenida.
Puede realizar actividades de forma individual o grupal en tiempo real.
Necesita una interfaz sencilla, clara, visual y adaptada a cualquier tamaño de pantalla.
Requiere instrucciones comprensibles para realizar las actividades.
Permisos principales:
Registrarse.
Iniciar sesión.
Gestionar su perfil.
Consultar contenido.
Realizar misiones y retos.
Obtener puntos.
Obtener recompensas.
Consultar progreso.
Consultar logros.
Participar en actividades grupales en tiempo real.
Cerrar sesión.
### 2.3.2 Docente
Rol independiente del sistema, orientado al acompañamiento del progreso de los estudiantes.
Características:
Debe conocer el funcionamiento general de la aplicación.
Utiliza la aplicación desde navegador web, típicamente desde un computador.
Debe estar autorizado como docente dentro de la institución o grupo correspondiente.
Debe comprender las reglas básicas del sistema de misiones y progresión para interpretar las estadísticas.
Permisos:
Iniciar sesión con credenciales de docente.
Crear y gestionar grupos de estudiantes.
Asociar estudiantes a un grupo mediante un código o mecanismo equivalente.
Consultar estadísticas de progreso individuales y por grupo (misiones completadas, puntos, niveles, participación en actividades de convivencia).
Cerrar sesión.
Dato pendiente:
• Definir si el docente podrá asignar o recomendar misiones específicas a su grupo; esta capacidad no fue solicitada para el MVP y queda como candidata a v2.0 (ver sección 6).
### 2.3.3 Administrador
Usuario con permisos especiales para gestionar los elementos del sistema.
Características:
Debe conocer el funcionamiento general de la aplicación.
Debe estar autorizado para administrar contenidos.
Debe comprender las reglas básicas del sistema de misiones y progresión.
Permisos propuestos:
Gestionar usuarios.
Gestionar misiones.
Gestionar retos.
Gestionar historias y contenidos históricos.
Gestionar actividades.
Gestionar niveles.
Gestionar recompensas.
Gestionar logros.
Los permisos exactos del administrador deberán validarse antes de la implementación.
## 2.4 Restricciones generales
Las restricciones identificadas son:
La aplicación será de tipo web, con diseño responsive para adaptarse a computadores, tablets y teléfonos móviles.
El MVP no incluirá funcionamiento sin conexión a Internet (modo offline); esta capacidad queda diferida a v2.0.
No existen tecnologías obligatorias definidas actualmente para el backend, base de datos ni infraestructura.
No existen integraciones externas definidas.
La aplicación no realizará diagnósticos psicológicos.
La aplicación no sustituirá la educación formal.
El contenido deberá ser apropiado para la población objetivo.
La aplicación deberá proteger la información de los usuarios, incluyendo el cumplimiento de la Ley 1581 de 2012 (Colombia) dado que trata datos de menores de edad.
La interfaz deberá estar orientada a usuarios jóvenes y estudiantes, y deberá diferenciarse claramente para el rol docente.
El sistema deberá permitir la incorporación futura de nuevos contenidos sin requerir una reconstrucción completa de la aplicación.
Las actividades grupales en tiempo real requieren conexión a Internet estable durante su ejecución.
## 2.5 Suposiciones y dependencias
Suposiciones
Los usuarios tendrán acceso a un navegador web actualizado sobre un dispositivo compatible (computador, tablet o teléfono).
Los usuarios dispondrán de conexión a Internet estable, en particular durante actividades grupales en tiempo real.
Existirá un mecanismo de almacenamiento persistente para usuarios y progreso.
El administrador será responsable de mantener actualizados los contenidos.
Los contenidos históricos y educativos serán revisados antes de publicarse.
Los contenidos relacionados con bienestar y convivencia serán de carácter educativo y recreativo, no clínico.
Los docentes contarán con un mecanismo (código de grupo u otro) para asociar estudiantes a su grupo.
Dependencias
Navegador web compatible en el dispositivo del usuario.
Servicios de almacenamiento de datos.
Servicio de autenticación.
Conectividad a Internet.
Infraestructura de servidor y un mecanismo de comunicación en tiempo real para las actividades grupales.
Estas dependencias deberán especificarse en el diseño técnico (SDD).
# 3. Requisitos específicos
## 3.1 Requisitos funcionales
RF-001 — Registro de usuario
El sistema deberá permitir que una persona cree una cuenta de estudiante proporcionando: nombre completo, correo electrónico, nombre de usuario, contraseña, edad y grado/curso.
Prioridad: Alta
Criterios de aceptación:
— El usuario deberá poder acceder al formulario de registro.
— El sistema deberá validar los campos obligatorios.
— El sistema deberá impedir registros con datos inválidos.
— El sistema deberá informar si la cuenta fue creada correctamente.
— El sistema deberá impedir la creación de cuentas duplicadas según el correo o nombre de usuario.
RF-002 — Inicio de sesión
El sistema deberá permitir que un usuario registrado inicie sesión mediante sus credenciales.
Prioridad: Alta
Criterios de aceptación:
— El usuario deberá introducir sus credenciales.
— El sistema deberá validar las credenciales.
— Las credenciales correctas deberán permitir el acceso.
— Las credenciales incorrectas deberán generar un mensaje de error.
— El sistema no deberá revelar información sensible en los mensajes de error.
RF-003 — Recuperación de contraseña
El sistema deberá permitir a un usuario restablecer su contraseña mediante un enlace enviado a su correo electrónico registrado.
Prioridad: Alta
Criterios de aceptación:
— El usuario podrá solicitar la recuperación desde la pantalla de inicio de sesión.
— El sistema enviará un enlace o código de un solo uso al correo registrado.
— El enlace deberá expirar después de un tiempo definido.
— El usuario podrá establecer una nueva contraseña válida.
— El sistema no deberá confirmar ni negar la existencia de una cuenta para un correo dado.
RF-004 — Cierre de sesión
El sistema deberá permitir al usuario cerrar su sesión de forma segura.
Prioridad: Alta
Criterios de aceptación:
— El usuario deberá disponer de una opción visible para cerrar sesión.
— Al cerrar sesión, deberá finalizarse la sesión autenticada.
— El usuario deberá volver a una pantalla no autenticada.
RF-005 — Gestión del perfil
El sistema deberá permitir al usuario consultar y modificar la información configurable de su perfil.
Prioridad: Alta
Criterios de aceptación:
— El usuario podrá acceder a su perfil.
— El sistema mostrará la información disponible.
— El usuario podrá modificar los campos autorizados.
— Los cambios válidos deberán guardarse.
— El sistema deberá informar si la actualización fue exitosa.
RF-006 — Personalización del perfil
El sistema deberá permitir personalizar los elementos del perfil que sean definidos por el diseño del juego.
Prioridad: Media
Criterios de aceptación:
— El usuario podrá seleccionar opciones de personalización disponibles.
— El sistema guardará las opciones seleccionadas.
— La personalización se mostrará posteriormente en el perfil.
RF-007 — Exploración del juego
El sistema deberá mostrar al usuario las categorías, misiones, retos y actividades disponibles de acuerdo con su progreso y permisos.
Prioridad: Alta
Criterios de aceptación:
— El usuario podrá acceder al menú principal.
— Se mostrarán las actividades disponibles.
— Las actividades bloqueadas deberán identificarse como tales.
— El sistema deberá diferenciar actividades disponibles y completadas.
RF-008 — Selección de misión
El usuario deberá poder seleccionar una misión disponible para consultar sus instrucciones e iniciar su ejecución.
Prioridad: Alta
Criterios de aceptación:
— El sistema mostrará el nombre de la misión.
— Mostrará instrucciones básicas.
— Indicará el estado de la misión.
— Permitirá iniciar una misión disponible.
RF-009 — Presentación de historias y contenidos históricos
El sistema deberá presentar historias y contenidos históricos de forma interactiva.
Prioridad: Alta
Criterios de aceptación:
— El contenido deberá ser legible.
— El usuario podrá avanzar por las secciones disponibles.
— El sistema deberá indicar cuándo el contenido ha sido completado.
— El contenido deberá estar asociado a la misión correspondiente.
RF-010 — Resolución de retos históricos
El sistema deberá permitir al usuario responder preguntas o resolver desafíos relacionados con los contenidos históricos.
Prioridad: Alta
Criterios de aceptación:
— El reto deberá presentar instrucciones.
— El usuario podrá seleccionar o introducir una respuesta según el tipo de reto.
— El sistema evaluará la respuesta.
— El sistema informará el resultado.
— El resultado podrá generar puntos de acuerdo con las reglas del juego.
RF-011 — Actividades recreativas
El sistema deberá permitir ejecutar actividades recreativas diseñadas para complementar la experiencia del videojuego.
Prioridad: Alta
Criterios de aceptación:
— El usuario podrá acceder a actividades disponibles.
— Cada actividad deberá incluir instrucciones.
— El usuario podrá completar la actividad.
— El sistema registrará la finalización cuando corresponda.
RF-012 — Misiones de convivencia
El sistema deberá proporcionar misiones orientadas a promover respeto, empatía, sana convivencia y colaboración.
Prioridad: Alta
Criterios de aceptación:
— Las misiones deberán contener instrucciones claras.
— El usuario podrá ejecutarlas.
— El sistema deberá registrar su resultado.
— El contenido no deberá presentarse como diagnóstico psicológico.
RF-013 — Mensajes positivos
El sistema deberá mostrar mensajes positivos durante o después de determinadas actividades.
Prioridad: Media
Criterios de aceptación:
— Los mensajes deberán aparecer en momentos definidos por el diseño.
— Los mensajes deberán utilizar lenguaje apropiado para estudiantes.
— Los mensajes no deberán presentar afirmaciones médicas o diagnósticas.
RF-014 — Asignación de puntos
El sistema deberá asignar puntos al usuario de acuerdo con las reglas definidas para las actividades y misiones.
Prioridad: Alta
Criterios de aceptación:
— Una actividad válida podrá generar puntos.
— El sistema deberá registrar los puntos obtenidos.
— Los puntos deberán reflejarse en el perfil o sección de progreso.
— El sistema no deberá asignar puntos duplicados por una misma acción cuando la regla de juego lo prohíba.
RF-015 — Recompensas
El sistema deberá permitir obtener recompensas de acuerdo con las condiciones establecidas por el juego.
Prioridad: Media
Criterios de aceptación:
— El sistema deberá definir las condiciones para cada recompensa.
— Cuando el usuario cumpla una condición, la recompensa deberá registrarse.
— El usuario podrá consultar las recompensas obtenidas.
RF-016 — Progresión de niveles
El sistema deberá permitir al usuario avanzar de nivel según los criterios definidos por el juego.
Prioridad: Alta
Criterios de aceptación:
— El sistema deberá determinar si el usuario cumple las condiciones para avanzar.
— El nivel actual deberá registrarse.
— Al cumplir los requisitos, el siguiente nivel deberá desbloquearse.
— El usuario deberá recibir una indicación del avance.
RF-017 — Consulta del progreso
El sistema deberá permitir al usuario consultar su progreso dentro del juego.
Prioridad: Alta
Criterios de aceptación:
— El usuario podrá consultar su nivel.
— Podrá consultar los puntos obtenidos.
— Podrá consultar las misiones completadas.
— Podrá consultar el avance disponible.
— La información mostrada deberá corresponder con los datos almacenados.
RF-018 — Retroalimentación
El sistema deberá proporcionar retroalimentación al usuario después de determinadas actividades.
Prioridad: Alta
Criterios de aceptación:
— El sistema indicará si la respuesta o actividad fue correcta cuando corresponda.
— Se proporcionará información orientativa para mejorar.
— La retroalimentación deberá ser comprensible.
— No deberá formular diagnósticos psicológicos.
RF-019 — Actividades grupales en tiempo real
El sistema deberá permitir la participación de varios usuarios simultáneamente en actividades diseñadas para fomentar el trabajo en equipo, con sincronización en tiempo real entre los participantes.
Prioridad: Alta
Criterios de aceptación:
— El usuario podrá crear o unirse a una sala de actividad grupal.
— El sistema mostrará los participantes conectados en la sala.
— La actividad deberá presentar instrucciones antes de iniciar.
— Los eventos de la actividad deberán reflejarse a todos los participantes de forma sincronizada.
— El sistema deberá registrar la participación y el resultado cuando técnicamente corresponda.
— La actividad deberá estar orientada a la colaboración.
— El sistema deberá manejar de forma controlada la desconexión de un participante durante la actividad.
RF-020 — Consulta de logros
El sistema deberá permitir al usuario consultar los logros obtenidos y, cuando corresponda, los que aún estén pendientes.
Prioridad: Media
Criterios de aceptación:
— El usuario podrá acceder a una sección de logros.
— Los logros obtenidos deberán identificarse.
— El sistema podrá mostrar condiciones para logros pendientes.
RF-021 — Registro e inicio de sesión de docente
El sistema deberá permitir a un docente autorizado registrarse e iniciar sesión bajo un rol independiente del rol de estudiante.
Prioridad: Alta
Criterios de aceptación:
— El docente deberá autenticarse con credenciales propias de su rol.
— El sistema deberá diferenciar la interfaz de docente de la de estudiante.
— Un docente no podrá acceder con su cuenta a funciones exclusivas de administrador.
RF-022 — Gestión de grupos de estudiantes (docente)
El sistema deberá permitir al docente crear grupos y asociar estudiantes a dichos grupos mediante un código u otro mecanismo equivalente.
Prioridad: Alta
Criterios de aceptación:
— El docente podrá crear un grupo.
— El sistema generará un mecanismo (por ejemplo, un código) para que los estudiantes se asocien al grupo.
— El docente podrá ver la lista de estudiantes asociados a cada grupo.
— El docente podrá retirar a un estudiante de su grupo.
RF-023 — Consulta de estadísticas de estudiantes (docente)
El sistema deberá permitir al docente consultar estadísticas de progreso de los estudiantes de sus grupos.
Prioridad: Alta
Criterios de aceptación:
— El docente podrá consultar el progreso individual de un estudiante de su grupo.
— El docente podrá consultar una vista agregada del progreso del grupo.
— Las estadísticas deberán incluir, como mínimo, misiones completadas, puntos y nivel.
— El docente no podrá consultar información de estudiantes fuera de sus grupos.
RF-024 — Administración de misiones
El sistema deberá permitir a un administrador autorizado crear, modificar, activar, desactivar y gestionar las misiones.
Prioridad: Alta
Criterios de aceptación:
— Solo usuarios autorizados podrán administrar misiones.
— El administrador podrá registrar los datos de una misión.
— Podrá modificar contenido existente.
— Podrá activar o desactivar una misión.
— Los cambios deberán conservarse.
RF-025 — Administración de contenidos
El sistema deberá permitir al administrador gestionar historias, contenidos históricos, retos y actividades.
Prioridad: Alta
Criterios de aceptación:
— El administrador podrá crear contenido.
— Podrá modificar contenido.
— Podrá desactivar contenido.
— El contenido deberá poder asociarse a una misión o actividad.
— El sistema deberá impedir que usuarios no autorizados administren contenido.
RF-026 — Administración de niveles, puntos y recompensas
El sistema deberá permitir gestionar las reglas de progresión definidas para el videojuego.
Prioridad: Media
Criterios de aceptación:
— El administrador podrá definir los valores necesarios.
— Los cambios deberán aplicarse a las nuevas interacciones según las reglas establecidas.
— La configuración deberá mantenerse almacenada.
RF-027 — Gestión de contenidos de convivencia
El sistema deberá permitir administrar contenidos relacionados con respeto, empatía, colaboración y sana convivencia.
Prioridad: Alta
Criterios de aceptación:
— El administrador podrá crear contenidos de convivencia.
— Podrá modificar contenidos.
— Podrá activar o desactivar contenidos.
— Los contenidos deberán poder asociarse a misiones o actividades.
RF-028 — Persistencia del progreso
El sistema deberá almacenar el progreso del usuario para permitir su recuperación en futuras sesiones.
Prioridad: Alta
Criterios de aceptación:
— Las misiones completadas deberán conservarse.
— Los puntos deberán conservarse.
— El nivel deberá conservarse.
— Los logros obtenidos deberán conservarse.
— El usuario deberá recuperar su progreso al iniciar una nueva sesión, incluso desde un dispositivo distinto.
RF-029 — Control de acceso por rol
El sistema deberá restringir las funcionalidades de estudiante, docente y administrador según el rol del usuario autenticado.
Prioridad: Alta
Criterios de aceptación:
— Un usuario estándar no podrá acceder a funciones administrativas ni docentes.
— Un docente no podrá acceder a funciones administrativas.
— Un administrador podrá acceder a las funciones autorizadas.
— Los permisos deberán comprobarse antes de ejecutar operaciones restringidas.
## 3.2 Requisitos no funcionales
RNF-001 — Rendimiento de la aplicación
La aplicación deberá cargar las pantallas, misiones y actividades de manera rápida y fluida, evitando interrupciones innecesarias durante la interacción.
Prioridad: Alta
Dato pendiente: definir tiempo máximo de carga objetivo para las principales pantallas durante la fase de diseño técnico y validación.
RNF-002 — Usabilidad
La aplicación deberá proporcionar una interfaz sencilla, clara, consistente y fácil de utilizar para estudiantes, adaptada a distintos tamaños de pantalla.
Prioridad: Alta
Criterios de aceptación:
— Los controles deberán ser identificables.
— Las instrucciones deberán ser comprensibles.
— La navegación deberá ser consistente.
— Los mensajes de error deberán ser claros.
RNF-003 — Seguridad de autenticación
El sistema deberá proteger las credenciales y controlar el acceso mediante mecanismos seguros de autenticación, para los tres roles (estudiante, docente, administrador).
Prioridad: Alta
RNF-004 — Protección de datos
La información asociada a los usuarios deberá almacenarse y transmitirse mediante mecanismos de seguridad adecuados.
Prioridad: Alta
Dato pendiente: definir política de privacidad, tipos de datos recolectados, tiempo de conservación y consentimiento aplicable a menores, en línea con RNF-014 (Ley 1581 de 2012).
RNF-005 — Disponibilidad
La aplicación deberá estar disponible para los usuarios cuando necesiten utilizarla, de acuerdo con las condiciones de infraestructura definidas para el proyecto.
Prioridad: Alta
Dato pendiente: establecer porcentaje objetivo de disponibilidad, por ejemplo, 99 %, 99,5 % u otro valor.
RNF-006 — Escalabilidad
La arquitectura deberá permitir incorporar nuevas misiones, temas históricos, actividades recreativas y contenidos de convivencia sin afectar significativamente las funcionalidades existentes.
Prioridad: Alta
RNF-007 — Mantenibilidad
El software deberá organizarse de manera modular para facilitar la corrección de errores, actualización de contenidos y adición de nuevas funcionalidades.
Prioridad: Media
RNF-008 — Compatibilidad de navegadores y dispositivos
La aplicación deberá funcionar correctamente en los navegadores web modernos (Chrome, Firefox, Edge y Safari, últimas dos versiones estables) y adaptarse mediante diseño responsive a computadores, tablets y teléfonos móviles.
Prioridad: Alta
RNF-009 — Accesibilidad
La aplicación deberá considerar características básicas de accesibilidad para facilitar su utilización por diferentes usuarios.
Prioridad: Media
Criterios de aceptación:
— Contraste adecuado.
— Tamaños de texto legibles.
— Elementos táctiles y de clic suficientemente grandes.
— Alternativas textuales cuando corresponda.
— Uso de colores que no sean el único medio para comunicar información.
RNF-010 — Integridad de datos
El sistema deberá evitar pérdidas o inconsistencias en puntos, niveles, logros y progreso, incluyendo durante actividades grupales en tiempo real.
Prioridad: Alta
RNF-011 — Recuperación ante errores
Ante errores de comunicación o fallos inesperados, el sistema deberá informar al usuario de manera comprensible y evitar, en la medida de lo posible, la pérdida del progreso previamente almacenado.
Prioridad: Media
RNF-012 — Extensibilidad
El sistema deberá permitir incorporar nuevos tipos de misiones, retos y actividades con un impacto controlado sobre los componentes existentes.
Prioridad: Media
RNF-013 — Latencia en actividades grupales en tiempo real
La comunicación utilizada para sincronizar las actividades grupales en tiempo real deberá mantener una latencia suficientemente baja para una experiencia fluida entre los participantes.
Prioridad: Alta
Dato pendiente: definir el umbral máximo de latencia aceptable durante el diseño técnico.
RNF-014 — Cumplimiento de protección de datos personales (Ley 1581 de 2012)
El sistema deberá cumplir con la Ley 1581 de 2012 de Colombia en el tratamiento de datos personales, considerando que una parte significativa de los usuarios son menores de edad.
Prioridad: Alta
Dato pendiente: definir mecanismo de aviso de privacidad, autorización de tratamiento de datos y, si aplica, el rol de padres/acudientes o de la institución educativa en la autorización para menores.
## 3.3 Requisitos de interfaz
### 3.3.1 Interfaz de usuario
RIU-001. La aplicación deberá presentar una pantalla de inicio o bienvenida.
RIU-002. La aplicación deberá disponer de formularios para registro, inicio de sesión y recuperación de contraseña.
RIU-003. La interfaz deberá utilizar navegación coherente entre las secciones.
RIU-004. Las misiones deberán mostrar claramente su nombre, estado, instrucciones y acción para iniciar.
RIU-005. Las actividades deberán mostrar instrucciones antes de comenzar.
RIU-006. El usuario deberá poder identificar visualmente su nivel, puntos y progreso.
RIU-007. Los mensajes de éxito, error y retroalimentación deberán ser claramente diferenciables.
RIU-008. Las opciones administrativas deberán estar separadas de la experiencia de usuario estándar.
RIU-009. La interfaz deberá ser responsive y adaptarse de forma fluida a pantallas de escritorio, tablet y teléfono móvil.
RIU-010. La interfaz del docente deberá estar visualmente diferenciada de la interfaz del estudiante y de la del administrador.
### 3.3.2 Interfaz de hardware
RIH-001. La aplicación deberá ejecutarse sobre navegador web en computadores de escritorio, portátiles, tablets y teléfonos móviles con capacidades estándar.
RIH-002. La interacción principal se realizará mediante mouse y teclado en dispositivos de escritorio, y mediante pantalla táctil en dispositivos móviles y tablets.
RIH-003. Si determinadas actividades requieren funciones específicas del dispositivo (cámara, micrófono, sensores), estas deberán definirse previamente.
Dato pendiente:
• Determinar si se utilizarán cámara, micrófono u otras capacidades del dispositivo/navegador (por ejemplo, Web Audio) para alguna actividad.
### 3.3.3 Interfaz de software
RIS-001. La aplicación deberá ejecutarse sobre los navegadores web oficialmente soportados (ver RNF-008).
RIS-002. La aplicación web deberá comunicarse con el servidor mediante una interfaz (API) definida.
RIS-003. Los datos del usuario deberán mantenerse sincronizados cuando las funciones dependan de información remota, incluyendo el estado de las actividades grupales en tiempo real.
RIS-004. No se han definido actualmente integraciones con sistemas externos.
### 3.3.4 Interfaz de comunicación
RIC-001. Cuando exista comunicación con servicios remotos, esta deberá realizarse mediante protocolos seguros (por ejemplo, HTTPS y su equivalente seguro para comunicación en tiempo real).
RIC-002. La aplicación deberá gestionar adecuadamente la pérdida temporal de conectividad.
RIC-003. Los errores de comunicación deberán mostrarse mediante mensajes comprensibles para el usuario.
RIC-004. Las actividades grupales en tiempo real requerirán un mecanismo de comunicación bidireccional de baja latencia entre los participantes y el servidor.
Dato pendiente:
• Definir arquitectura de comunicación, protocolo específico para tiempo real, mecanismo de autenticación de la conexión y estrategia de reconexión ante caídas temporales.
# 4. Casos de uso principales
CU-001 — Registrar usuario
Actor principal: Usuario
Precondiciones:
El usuario no debe tener una cuenta existente con el correo o nombre de usuario utilizado.
La aplicación debe estar disponible.
Flujo básico:
1. El usuario abre MindGame en su navegador.
2. Selecciona "Registrarse".
3. El sistema muestra el formulario.
4. El usuario introduce los datos requeridos.
5. El usuario envía el formulario.
6. El sistema valida la información.
7. El sistema crea la cuenta.
8. El sistema informa que el registro fue exitoso.
Postcondiciones:
Existe una cuenta de usuario.
El usuario puede iniciar sesión.
CU-002 — Iniciar sesión
Actor principal: Usuario
Precondiciones:
El usuario debe estar registrado.
Flujo básico:
1. El usuario selecciona "Iniciar sesión".
2. Introduce sus credenciales.
3. El sistema valida las credenciales.
4. El sistema autentica al usuario.
5. Se muestra la pantalla principal correspondiente a su rol.
Flujo alternativo:
Si las credenciales son incorrectas, el sistema informa el error y solicita nuevamente los datos.
Si el usuario olvidó su contraseña, puede iniciar el flujo de recuperación (RF-003).
Postcondiciones:
Existe una sesión autenticada.
CU-003 — Gestionar perfil
Actor principal: Usuario
Precondiciones:
El usuario debe haber iniciado sesión.
Flujo básico:
1. El usuario accede a su perfil.
2. El sistema muestra la información disponible.
3. El usuario selecciona modificar.
4. Actualiza los datos permitidos.
5. Guarda los cambios.
6. El sistema valida y almacena la información.
Postcondiciones:
El perfil queda actualizado.
CU-004 — Realizar misión histórica
Actor principal: Usuario
Precondiciones:
El usuario debe haber iniciado sesión.
La misión debe estar disponible.
Flujo básico:
1. El usuario explora las misiones.
2. Selecciona una misión histórica.
3. El sistema presenta la historia o contenido.
4. El usuario consulta el contenido.
5. El sistema presenta el reto asociado.
6. El usuario responde.
7. El sistema evalúa la respuesta.
8. El sistema muestra retroalimentación.
9. El sistema registra la finalización.
10. El sistema asigna los puntos correspondientes.
Postcondiciones:
La misión queda registrada como completada, si se cumplen las condiciones.
El progreso y los puntos se actualizan.
CU-005 — Realizar actividad de convivencia
Actor principal: Usuario
Precondiciones:
El usuario debe haber iniciado sesión.
La actividad debe estar disponible.
Flujo básico:
1. El usuario selecciona una actividad.
2. El sistema muestra las instrucciones.
3. El usuario realiza la actividad.
4. El sistema registra el resultado cuando corresponda.
5. El sistema presenta retroalimentación.
6. El sistema actualiza el progreso.
Postcondiciones:
La actividad queda registrada.
Se actualizan los elementos de progreso correspondientes.
CU-006 — Consultar progreso
Actor principal: Usuario
Precondiciones:
El usuario debe haber iniciado sesión.
Flujo básico:
1. El usuario accede a "Progreso".
2. El sistema recupera los datos del usuario.
3. El sistema muestra nivel, puntos, misiones y logros.
4. El usuario consulta su avance.
Postcondiciones:
El usuario obtiene información actualizada sobre su progreso.
CU-007 — Participar en actividad grupal en tiempo real
Actor principal: Usuario
Actores secundarios: Otros usuarios conectados simultáneamente
Precondiciones:
El usuario debe haber iniciado sesión.
La actividad grupal debe estar disponible.
Flujo básico:
1. El usuario accede a las actividades grupales.
2. Selecciona una actividad y crea o se une a una sala.
3. El sistema muestra los participantes conectados en la sala.
4. El sistema presenta las instrucciones.
5. Al reunirse los participantes necesarios, la actividad inicia de forma sincronizada.
6. Los usuarios participan; el sistema sincroniza los eventos en tiempo real entre todos los participantes.
7. El sistema registra la participación o resultado según el diseño.
8. El sistema muestra la finalización de la actividad a todos los participantes.
Flujo alternativo:
Si un participante se desconecta durante la actividad, el sistema deberá gestionar la situación de forma controlada (por ejemplo, notificando a los demás participantes).
Postcondiciones:
La participación queda registrada cuando corresponda.
CU-008 — Gestionar contenido
Actor principal: Administrador
Precondiciones:
El administrador debe haber iniciado sesión.
Debe disponer de permisos administrativos.
Flujo básico:
1. El administrador accede al módulo de administración.
2. Selecciona el tipo de contenido.
3. Crea o selecciona un elemento existente.
4. Introduce o modifica la información.
5. Guarda los cambios.
6. El sistema valida la información.
7. El sistema almacena el contenido.
Postcondiciones:
El contenido queda disponible o actualizado según su estado.
CU-009 — Obtener recompensa o logro
Actor principal: Usuario
Precondiciones:
El usuario debe haber cumplido la condición correspondiente.
Flujo básico:
1. El usuario completa una actividad.
2. El sistema calcula el resultado.
3. El sistema verifica las condiciones de recompensa o logro.
4. Si se cumplen, registra el elemento obtenido.
5. El sistema notifica al usuario.
6. El logro o recompensa aparece en el perfil.
Postcondiciones:
La recompensa o logro queda asociado al usuario.
CU-010 — Cerrar sesión
Actor principal: Usuario/Docente/Administrador
Precondiciones:
Existe una sesión activa.
Flujo básico:
1. El usuario selecciona "Cerrar sesión".
2. El sistema finaliza la sesión.
3. El sistema devuelve al usuario a una pantalla de acceso.
Postcondiciones:
La sesión autenticada queda finalizada.
CU-011 — Consultar estadísticas de estudiantes
Actor principal: Docente
Precondiciones:
El docente debe haber iniciado sesión.
El docente debe tener al menos un grupo con estudiantes asociados.
Flujo básico:
1. El docente accede a la sección de grupos.
2. Selecciona un grupo.
3. El sistema muestra la lista de estudiantes del grupo con su progreso resumido.
4. El docente selecciona un estudiante para ver el detalle.
5. El sistema muestra las estadísticas detalladas del estudiante (misiones, puntos, nivel, logros).
Postcondiciones:
El docente obtiene información actualizada sobre el progreso de su grupo.
# 5. Matriz de trazabilidad de requisitos
## Objetivos del proyecto
## Matriz objetivo–requisito
## Trazabilidad funcional ampliada
# 6. Alcance del MVP y backlog de v2.0
Con el fin de mantener el desarrollo dentro de un alcance controlado, se establece de forma explícita qué queda dentro del MVP (v1.0, aplicación web responsive) y qué se difiere a una versión posterior (v2.0).
## 6.1 Incluido en el MVP (v1.0)
Registro, inicio de sesión y recuperación de contraseña.
Gestión y personalización básica del perfil.
Exploración de misiones, retos históricos y actividades recreativas.
Misiones y actividades de convivencia.
Actividades grupales multiusuario en tiempo real.
Sistema de puntos, niveles, recompensas y logros.
Consulta de progreso y retroalimentación.
Rol docente con gestión de grupos y consulta de estadísticas.
Panel administrativo para gestión de contenidos.
Diseño responsive para escritorio, tablet y teléfono móvil.
## 6.2 Diferido a v2.0 (fuera del MVP)
Funcionamiento sin conexión a Internet (modo offline).
Notificaciones push en el navegador.
Asignación o recomendación de misiones específicas por parte del docente a su grupo.
Reportes exportables o comparativos entre grupos para el docente.
Ampliación de tipos de retos históricos más allá de los definidos inicialmente por el equipo de contenido.
Posibles integraciones con sistemas académicos institucionales externos.
# 7. Anexos
## Anexo A — Glosario ampliado
Aprendizaje interactivo
Proceso mediante el cual el usuario adquiere o refuerza conocimientos mediante interacción directa con actividades digitales.
Bienestar emocional
Concepto utilizado en el proyecto para referirse a actividades recreativas y educativas que buscan favorecer experiencias positivas. No implica diagnóstico ni tratamiento psicológico.
Convivencia
Interacción respetuosa y colaborativa entre personas, basada en valores como respeto, empatía, tolerancia y trabajo en equipo.
Misión
Conjunto organizado de actividades que el jugador debe completar dentro del videojuego.
Reto
Desafío que requiere que el usuario responda, resuelva o complete una actividad.
Nivel
Estado de progresión del jugador que puede desbloquear nuevos contenidos.
Puntos
Valor cuantitativo utilizado por el videojuego para representar determinadas acciones o avances.
Recompensa
Elemento que recibe el usuario al alcanzar una condición establecida.
Logro
Reconocimiento asociado al cumplimiento de una condición específica.
Sala (actividad en tiempo real)
Espacio virtual temporal donde se agrupan los participantes de una actividad grupal sincronizada.
## Anexo B — Diagrama conceptual de módulos
┌─────────────────────┐
│      MINDGAME        │
│  (aplicación web)    │
└──────────┬──────────┘
│
┌───────────────┬──────────┼──────────┬───────────────┐
▼               ▼          ▼          ▼               ▼
┌───────────┐  ┌──────────────┐ ┌────────┐ ┌────────────┐ ┌───────────────┐
│Autenticac.│  │Perfil usuario│ │Docente │ │Administrac.│ │Motor de juego │
└─────┬─────┘  └──────┬───────┘ └───┬────┘ └─────┬──────┘ └───────┬───────┘
│               │             │            │                │
└───────────────┴─────────────┴────────────┴────────┬───────┘
▼
┌────────────────────┐
│ Gestión de contenido│
└──────────┬─────────┘
│
┌────────────────┬──────────────────┼──────────────────┐
▼                ▼                  ▼                  ▼
┌───────────┐   ┌───────────┐      ┌────────────┐   ┌──────────────────┐
│ Misiones  │   │  Retos    │      │Actividades │   │ Actividades       │
└─────┬─────┘   └─────┬─────┘      └──────┬─────┘   │ grupales tiempo   │
│               │                   │         │ real (salas)      │
└───────────────┼───────────────────┘         └─────────┬─────────┘
▼                                        │
┌──────────────────────┐                              │
│ Progreso y puntos    │◄─────────────────────────────┘
└──────────┬───────────┘
│
┌────────────────┼────────────────┐
▼                ▼                 ▼
┌──────────┐    ┌──────────────┐  ┌────────────┐
│ Niveles  │    │ Recompensas  │  │  Logros    │
└──────────┘    └──────────────┘  └────────────┘
## Anexo C — Flujo general del usuario
INICIO (navegador web)
│
▼
¿Tiene una cuenta?
/        \
NO         SÍ
│           │
▼           ▼
Registrarse  Iniciar sesión ── ¿Olvidó contraseña? → Recuperación
│           │
└─────┬─────┘
▼
Pantalla principal (según rol: estudiante / docente / administrador)
│
┌────┼─────────┬──────────┐
▼    ▼         ▼          ▼
Misiones Actividades  Grupales   Perfil
│       │         (tiempo real)
▼       ▼             │
Retos  Convivencia      ▼
│       │        Sala compartida
└───┬───┘             │
▼                 ▼
Completar         Sincronización
actividad          entre usuarios
│                 │
└────────┬────────┘
▼
Retroalimentación
│
▼
Puntos / Logros
│
▼
¿Sube de nivel?
/       \
SÍ         NO
│           │
▼           ▼
Desbloquea   Continúa
contenido    progreso
│           │
└─────┬─────┘
▼
Seguir jugando
│
▼
Cerrar sesión
## Anexo D — Estado de las decisiones pendientes
La versión 1.0 de esta ERS dejaba abiertas varias decisiones. La tabla siguiente resume cuáles quedaron resueltas para esta versión 1.2 y cuáles continúan pendientes de definición.
# Conclusión
La presente ERS (versión 1.2) redefine a MindGame como una aplicación web responsive, estableciendo el comportamiento esperado del sistema, sus usuarios (estudiante, docente y administrador), funcionalidades principales, requisitos de calidad, interfaces, casos de uso, trazabilidad con los objetivos del proyecto y el alcance explícito del MVP frente a v2.0.
El documento está estructurado siguiendo el enfoque de especificación de requisitos solicitado y tomando como referencia IEEE 830 y, principalmente, ISO/IEC/IEEE 29148:2018. La norma ISO/IEC/IEEE 29148 define procesos e información relacionados con la ingeniería de requisitos a lo largo del ciclo de vida, mientras que IEEE identifica 830-1998 como un estándar histórico que fue sustituido por la familia 29148.
Estado recomendado: aprobación preliminar.
Antes de considerar esta ERS como una línea base definitiva, deberán validarse especialmente las reglas numéricas de puntuación y niveles, los tipos exactos de retos, las funciones exactas del administrador, el mecanismo operativo de autorización de datos de menores (Ley 1581 de 2012) y las métricas cuantitativas de rendimiento y disponibilidad.
--- TABLE 0 ---
Término | Definición
ERS | Especificación de Requisitos de Software.
RF | Requisito Funcional.
RNF | Requisito No Funcional.
Usuario | Persona que utiliza las funcionalidades disponibles de MindGame.
Docente | Usuario con rol independiente que gestiona grupos de estudiantes y consulta sus estadísticas de progreso.
Administrador | Usuario autorizado para gestionar contenidos y elementos administrativos de la aplicación.
Misión | Actividad estructurada que el jugador debe completar para avanzar dentro del juego.
Reto | Actividad o desafío que permite comprobar conocimientos o desarrollar habilidades.
Nivel | Etapa de progresión del usuario dentro del videojuego.
Puntos | Unidad utilizada para representar el progreso y desempeño del jugador.
Recompensa | Elemento obtenido por el usuario después de cumplir determinados objetivos.
Logro | Reconocimiento obtenido al cumplir una condición específica dentro del juego.
Retroalimentación | Información proporcionada al usuario sobre el resultado de una actividad.
Perfil | Información y configuración asociada a un usuario.
Convivencia | Conjunto de comportamientos y actividades orientadas al respeto, empatía, colaboración y sana interacción.
Contenido histórico | Información, historias, preguntas o retos relacionados con hechos y conocimientos históricos.
Interfaz de usuario | Elementos visuales y controles mediante los cuales el usuario interactúa con la aplicación.
Sesión | Periodo durante el cual un usuario se encuentra autenticado en el sistema.
Responsive | Capacidad de la interfaz web de adaptarse a distintos tamaños de pantalla (escritorio, tablet, móvil).
Actividad en tiempo real | Actividad grupal en la que varios usuarios interactúan simultáneamente, con sincronización inmediata entre los participantes.
--- TABLE 1 ---
ID | Objetivo
OBJ-001 | Desarrollar un videojuego interactivo que contribuya al mejoramiento del estado emocional y la recreación mediante actividades dinámicas.
OBJ-002 | Diseñar una interfaz llamativa, fácil de usar y responsive.
OBJ-003 | Implementar actividades recreativas y dinámicas, incluyendo interacción grupal en tiempo real.
OBJ-004 | Aplicar herramientas de programación para desarrollar un videojuego web funcional.
OBJ-005 | Promover bienestar emocional y sana recreación.
OBJ-006 | Brindar al docente visibilidad sobre el progreso de sus estudiantes.
--- TABLE 2 ---
Objetivo | Requisitos relacionados
OBJ-001 | RF-007, RF-008, RF-010, RF-011, RF-012, RF-014, RF-016, RF-018
OBJ-002 | RNF-002, RNF-008, RNF-009, RIU-001 a RIU-010
OBJ-003 | RF-010, RF-011, RF-012, RF-019, RF-020, RNF-013
OBJ-004 | RF-001 a RF-029, RNF-006, RNF-007, RNF-012
OBJ-005 | RF-011, RF-012, RF-013, RF-018, RF-019
OBJ-006 | RF-021, RF-022, RF-023, RIU-010
--- TABLE 3 ---
Requisito | Objetivo | Caso de uso
RF-001 | OBJ-004 | CU-001
RF-002 | OBJ-004 | CU-002
RF-003 | OBJ-004 | CU-002
RF-005 | OBJ-002, OBJ-004 | CU-003
RF-007 | OBJ-001, OBJ-003 | CU-004, CU-005
RF-009 | OBJ-001 | CU-004
RF-010 | OBJ-001, OBJ-003 | CU-004
RF-011 | OBJ-001, OBJ-003, OBJ-005 | CU-005
RF-012 | OBJ-001, OBJ-005 | CU-005
RF-014 | OBJ-001 | CU-004, CU-009
RF-016 | OBJ-001 | CU-004, CU-009
RF-017 | OBJ-001 | CU-006
RF-018 | OBJ-001, OBJ-005 | CU-004, CU-005
RF-019 | OBJ-003, OBJ-005 | CU-007
RF-020 | OBJ-001 | CU-006, CU-009
RF-021 | OBJ-006 | CU-002, CU-011
RF-022 | OBJ-006 | CU-011
RF-023 | OBJ-006 | CU-011
RF-024 | OBJ-004 | CU-008
RF-025 | OBJ-004 | CU-008
RF-027 | OBJ-005 | CU-008
RF-028 | OBJ-004 | CU-006
RF-029 | OBJ-004 | CU-008, CU-011
--- TABLE 4 ---
Punto pendiente (v1.0) | Estado en v1.2
Plataformas objetivo (Android/iOS) | Resuelto: aplicación web responsive; ya no aplica plataforma nativa (ver restricciones, sección 2.4).
Datos exactos del registro | Resuelto: nombre completo, correo, usuario, contraseña, edad y grado/curso (RF-001).
Recuperación de contraseña | Resuelto: incluida en el MVP (RF-003).
Modalidad de actividades grupales | Resuelto: multiusuario en tiempo real (RF-019, CU-007).
Rol del docente | Resuelto: rol independiente con gestión de grupos y estadísticas (RF-021 a RF-023).
Funcionamiento sin conexión | Resuelto: fuera del MVP, diferido a v2.0 (sección 6.2).
Reglas exactas de puntos y niveles (valores numéricos) | Pendiente: a definir por el equipo de diseño/balance del juego.
Tipos exactos de recompensas y logros | Pendiente: a definir por el equipo de contenido.
Tipos de retos históricos a implementar en el MVP | Pendiente: a validar con el responsable del proyecto; ampliaciones futuras quedan en el backlog de v2.0.
Funcionalidades exactas del administrador | Parcialmente definido (RF-024 a RF-027); permisos exactos a validar.
Servidor, arquitectura tecnológica y base de datos | Fuera del alcance de esta ERS; se definirá en el SDD.
Requisitos mínimos de rendimiento (tiempos de carga/respuesta) | Pendiente: métricas concretas a definir en diseño técnico (RNF-001).
Disponibilidad esperada (%) | Pendiente: valor objetivo a definir (RNF-005).
Política de privacidad y tratamiento de datos de menores | Parcialmente resuelto: se incorpora RNF-014 (Ley 1581 de 2012); falta definir el mecanismo operativo de autorización.
Mecanismos de seguridad y autenticación | Pendiente: mecanismo concreto a definir en diseño técnico (RNF-003).
Necesidad de notificaciones push | Diferido a v2.0 (sección 6.2).
Necesidad de audio, música, cámara, micrófono u otras capacidades | Pendiente: a definir por el equipo de diseño del juego (RIH-003).
Diseño visual (colores, tipografía, personajes, identidad visual) | Pendiente: fuera del alcance de esta ERS.
Contenido educativo (temas, fuentes, nivel académico, validadores) | Pendiente: a definir por el equipo de contenido.