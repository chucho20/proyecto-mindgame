PLAN DE TRABAJO
Proyecto: MindGame
Tipo de aplicación: Videojuego educativo e interactivo — Aplicación web responsive
Versión del documento: 1.0
Fecha: Agosto de 2026
Periodo del proyecto: Agosto – Octubre de 2026
Documentos base: ERS MindGame v1.2 · SDD MindGame v1.0
Parámetros confirmados: equipo de 5 personas (Scrum Master/Tech Lead, backend, 2 frontend, UX/QA); días de trabajo lunes, jueves y sábado; herramienta de gestión de tareas: Notion; 6 sprints de 2 semanas (Sprint 0 de entorno, congelación de alcance tras Sprint 4, Sprint 6 de contingencia).
# 1. Introducción
## 1.1 Propósito
Este Plan de Trabajo organiza el desarrollo de MindGame bajo Scrum, distribuyendo los requisitos de la ERS v1.2 y los módulos del SDD v1.0 en sprints de dos semanas, con roles, responsabilidades, ceremonias y un cronograma alineado con los días de disponibilidad del equipo.
## 1.2 Alcance
El plan cubre el desarrollo del MVP definido en la ERS v1.2 (sección 6.1), desde el Sprint 0 (entorno) hasta el Sprint 6 (contingencia y cierre), dentro del periodo septiembre – noviembre de 2026. No incluye la planificación de las funcionalidades diferidas a v2.0.
# 2. Equipo de trabajo
Nota: siguiendo el patrón utilizado en otros proyectos del programa, no se define un rol de DevOps independiente; estas tareas quedan a cargo del desarrollador backend.
# 3. Metodología
## 3.1 Marco de trabajo
El proyecto se desarrolla bajo Scrum, con sprints de dos semanas. El equipo trabaja los días lunes, jueves y sábado; las ceremonias se anclan a estos días para no requerir sesiones adicionales.
## 3.2 Ceremonias
## 3.3 Herramienta de gestión
El backlog, las historias de usuario y el tablero de sprint se gestionan en Notion, siguiendo el mismo patrón utilizado en Danzas.app: una base de datos de historias vinculadas a los RF/RNF de la ERS, con estados (Por hacer / En curso / En revisión / Hecho) y una vista de tablero por sprint.
# 4. Cronograma de sprints
Cada sprint abarca dos semanas, con sesiones de trabajo los lunes, jueves y sábado (6 sesiones por sprint).
Sprint 0 — Entorno y fundamentos (7 – 19 agosto 2026)
Configuración de repositorios, entorno Node.js/React/MySQL, esqueleto de Socket.io, estándares de código, wireframes iniciales (UX) y refinamiento del backlog en Notion.
Requisitos relacionados: —
Sprint 1 — Autenticación y perfil (21 agosto – 3 septiembre 2026)
Registro, inicio/cierre de sesión, recuperación de contraseña, control de acceso por rol, gestión y personalización de perfil.
Requisitos relacionados: RF-001 a RF-006, RF-021, RF-029
Sprint 2 — Contenido y misiones (5 – 17 septiembre 2026)
Exploración de misiones, presentación de historias, resolución de retos históricos (evaluadores Strategy), administración de misiones y contenidos.
Requisitos relacionados: RF-007 a RF-011, RF-024, RF-025
Sprint 3 — Convivencia y progresión (19 – 31 septiembre 2026)
Actividades recreativas y de convivencia, mensajes positivos, puntos, niveles, recompensas, logros, consulta de progreso y retroalimentación.
Requisitos relacionados: RF-012 a RF-018, RF-020, RF-026, RF-027
Sprint 4 — Tiempo real y rol docente — Congelación de alcance (2 – 14 octubre 2026)
Actividades grupales en tiempo real (salas, Socket.io), registro/login de docente, gestión de grupos y estadísticas. Al cierre de este sprint se congela el alcance del MVP.
Requisitos relacionados: RF-019, RF-021 a RF-023
Sprint 5 — Integración, seguridad y pulido (16 – 28 octubre 2026)
Pruebas de integración end-to-end, revisión de seguridad (JWT, roles, HTTPS/WSS), ajustes de accesibilidad y responsive, persistencia de progreso entre dispositivos.
Requisitos relacionados: RNF-002, RNF-003, RNF-008 a RNF-010, RNF-013, RNF-014
Sprint 6 — Contingencia y cierre (29 – 30 octubre 2026)
Sprint de contingencia: corrección de errores detectados, ajustes finales de rendimiento y disponibilidad, preparación de la entrega y documentación final.
Requisitos relacionados: Transversal
# 5. Distribución de responsabilidades por módulo
# 6. Hitos
# 7. Gestión de riesgos
# Conclusión
Este Plan de Trabajo distribuye el desarrollo del MVP de MindGame en 7 sprints (0 a 6) entre el 7 de septiembre y el 12 de diciembre de 2026, con un equipo de 5 personas trabajando los lunes, jueves y sábado, gestionado en Notion. El alcance del MVP se congela al cierre del Sprint 4, dejando el Sprint 5 para integración y pulido, y el Sprint 6 como contingencia antes de la entrega final.
Estado recomendado: aprobación preliminar, sujeta a la validación de los riesgos señalados en la sección 7, en particular las reglas de puntos/niveles y el mecanismo de autorización de datos de menores.
--- TABLE 0 ---
Rol | Responsabilidades principales
Scrum Master / Tech Lead | Facilita las ceremonias, gestiona el backlog en Notion, resuelve bloqueos, toma decisiones de arquitectura junto con el equipo y da seguimiento al cumplimiento del plan.
Desarrollador backend | Implementa la API REST, el servidor Socket.io, los repositorios de datos, la seguridad (JWT, roles) y absorbe las tareas de DevOps (despliegue en Render/Railway, base de datos).
Desarrollador frontend 1 | Implementa las vistas de estudiante: exploración de misiones, retos, actividades, progreso y actividades grupales en tiempo real (cliente Socket.io).
Desarrollador frontend 2 | Implementa las vistas de docente y administrador, y los componentes compartidos del diseño responsive.
Diseñador UX / QA | Define wireframes y estilo visual, valida la accesibilidad (RNF-009) y ejecuta las pruebas funcionales contra los criterios de aceptación de cada RF.
--- TABLE 1 ---
Ceremonia | Día | Descripción
Sprint Planning | Lunes (primer día del sprint) | Se seleccionan las historias del backlog priorizado en Notion y se estiman las tareas del sprint.
Seguimiento (Daily adaptado) | Lunes, jueves y sábado | Revisión breve de avances y bloqueos al inicio de cada sesión de trabajo, dado que el equipo no trabaja todos los días de la semana.
Sprint Review | Sábado (último día del sprint) | Demostración de lo construido durante el sprint frente al Scrum Master/Tech Lead (y al responsable del proyecto cuando aplique).
Sprint Retrospective | Sábado (después de la Review) | Identificación de mejoras al proceso del equipo para el siguiente sprint.
--- TABLE 2 ---
Módulo (SDD) | Responsable principal | Apoyo
Autenticación y control de acceso | Backend | Scrum Master/Tech Lead
Perfil | Frontend 1 | UX/QA
Contenido y misiones (incl. Strategy de retos) | Backend | Frontend 1
Convivencia | Backend | Frontend 1
Progresión (puntos, niveles, recompensas, logros) | Backend | Frontend 1, Frontend 2
Actividades grupales en tiempo real (Socket.io) | Backend | Frontend 1
Módulo docente | Frontend 2 | Backend
Módulo administrativo | Frontend 2 | Backend
Diseño responsive y accesibilidad | UX/QA | Frontend 1, Frontend 2
Pruebas funcionales contra criterios de aceptación | UX/QA | Todo el equipo
Despliegue e infraestructura (Vercel, Render/Railway, MySQL) | Backend | Scrum Master/Tech Lead
--- TABLE 3 ---
Hito | Fecha | Criterio de cumplimiento
Entorno listo | 19 ago 2026 | Repositorios, CI y esqueleto de los tres servicios (frontend, API, Socket.io) desplegados en ambiente de desarrollo.
Autenticación y perfil funcionales | 3 sep 2026 | Un usuario puede registrarse, iniciar sesión, recuperar contraseña y gestionar su perfil.
Núcleo de juego funcional | 31 sep 2026 | Un estudiante puede completar una misión histórica y una actividad de convivencia, y ver reflejado su progreso.
Congelación de alcance del MVP | 14 oct 2026 | Actividades en tiempo real y rol docente implementados; no se aceptan nuevas funcionalidades para v1.0 a partir de esta fecha.
MVP integrado y probado | 28 oct 2026 | Los tres roles (estudiante, docente, administrador) operan de extremo a extremo sobre el ambiente desplegado.
Entrega final | 31 oct 2026 | Cierre del sprint de contingencia, documentación actualizada y entrega del MVP.
--- TABLE 4 ---
Riesgo | Impacto | Mitigación
Complejidad subestimada de la sincronización en tiempo real (RF-019) | Alto | Se ubica en Sprint 4, después de consolidar el resto del núcleo del juego; Sprint 6 actúa como contingencia si se requieren ajustes adicionales.
Disponibilidad limitada del equipo (solo 3 días/semana) | Medio | Ceremonias ancladas a los días de trabajo; alcance de cada sprint dimensionado a 6 sesiones efectivas.
Ambigüedad remanente en reglas de puntos/niveles y contenido educativo (ver Anexo D de la ERS) | Medio | Debe validarse con el responsable del proyecto antes de Sprint 2-3; de no resolverse, se usan valores provisionales documentados.
Cumplimiento de la Ley 1581 de 2012 para menores de edad | Alto | Definir el mecanismo operativo de autorización antes de Sprint 1 (módulo de autenticación); revisión por el Scrum Master/Tech Lead.
Cambios de alcance después de la congelación (Sprint 4) | Medio | Cualquier solicitud posterior se documenta como candidata a v2.0, según el backlog ya definido en la ERS (sección 6.2).