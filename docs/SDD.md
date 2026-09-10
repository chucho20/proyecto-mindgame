DOCUMENTO DE DISEÑO DE SOFTWARE (SDD)
Proyecto: MindGame
Tipo de aplicación: Videojuego educativo e interactivo — Aplicación web responsive
Versión del documento: 1.0
Fecha: 7 de septiembre de 2026
Estado: Borrador para validación técnica
Documento base: ERS MindGame v1.2
Decisiones tecnológicas confirmadas para este SDD: Frontend en React + Vite; backend en Node.js + Express; comunicación en tiempo real mediante Socket.io; persistencia en MySQL a través del patrón Repository; equipo de 5 personas (Scrum Master/Tech Lead, backend, 2 frontend, UX/QA); hospedaje en infraestructura gratuita (Vercel + Render/Railway + MySQL gestionado).
# 1. Introducción
## 1.1 Propósito
Este documento describe el diseño técnico de MindGame: su arquitectura, modelo de datos, componentes, patrones de diseño, mecanismo de comunicación en tiempo real, API, seguridad y diseño de interfaz. Traduce los requisitos definidos en la ERS v1.2 en decisiones concretas de implementación para guiar al equipo de desarrollo.
## 1.2 Alcance
El diseño cubre el MVP (v1.0) de MindGame definido en la ERS v1.2: aplicación web responsive con roles de estudiante, docente y administrador, incluyendo actividades grupales sincronizadas en tiempo real. No cubre las funcionalidades diferidas a v2.0 (modo offline, notificaciones push, reportes docentes avanzados, integraciones académicas externas), aunque la arquitectura se diseña considerando su incorporación futura sin reconstrucción completa (RNF-006, RNF-012).
## 1.3 Definiciones y referencias
Los términos y acrónimos utilizados (RF, RNF, misión, reto, nivel, rol docente, sala, etc.) corresponden a los definidos en la ERS MindGame v1.2, sección 1.3. Este documento hace referencia directa a los requisitos de dicha ERS mediante sus identificadores (RF-XXX, RNF-XXX).
# 2. Objetivos y restricciones de diseño
## 2.1 Objetivos de diseño
Separar claramente las responsabilidades de presentación, lógica de negocio y acceso a datos (patrón MVC + Repository).
Permitir que la comunicación en tiempo real (RF-019) opere de forma independiente de la API REST, sin acoplar la lógica de sincronización al resto del sistema.
Facilitar la incorporación de nuevos tipos de retos, actividades y contenidos sin modificar el código existente (RNF-006, RNF-012), mediante el patrón Strategy.
Mantener el sistema desplegable en infraestructura de nivel gratuito, acorde con el contexto del proyecto SENA.
Diseñar el control de acceso por rol (estudiante, docente, administrador) como una capa transversal aplicable a toda la API (RF-029).
## 2.2 Restricciones de diseño
El sistema deberá ser una aplicación web responsive; no se contempla app nativa en el MVP.
La comunicación en tiempo real deberá soportar baja latencia entre participantes de una misma sala (RNF-013).
El almacenamiento de datos personales deberá cumplir la Ley 1581 de 2012 (RNF-014).
La infraestructura deberá ajustarse a los límites de los planes gratuitos de Vercel, Render/Railway y el proveedor de MySQL elegido.
El equipo de desarrollo está compuesto por 5 personas; el diseño debe permitir trabajo paralelo entre frontend y backend sin bloqueos significativos.
# 3. Arquitectura del sistema
## 3.1 Vista general
MindGame utiliza una arquitectura cliente-servidor de tres capas, con el patrón Modelo-Vista-Controlador (MVC) en el backend combinado con el patrón Repository para el acceso a datos. La comunicación se divide en dos canales complementarios: peticiones REST (para operaciones convencionales de creación, lectura, actualización) y un canal de comunicación en tiempo real mediante Socket.io (exclusivo para las actividades grupales sincronizadas, RF-019).
## 3.2 Diagrama de arquitectura
┌───────────────────────────────────────────────────────────────┐
│                    CLIENTE (navegador web)                    │
│   React + Vite  —  Responsive (escritorio / tablet / móvil)   │
│   ┌───────────────┐   ┌──────────────┐   ┌──────────────┐    │
│   │ Vistas         │   │ Cliente REST │   │ Cliente      │    │
│   │ Estudiante/    │   │ (Axios/fetch)│   │ Socket.io    │    │
│   │ Docente/Admin  │   │              │   │ (tiempo real)│    │
│   └───────┬────────┘   └──────┬───────┘   └──────┬───────┘    │
└───────────┼─────────────────────┼──────────────────┼──────────┘
│                 HTTPS│                 │ WSS
│                     ▼                  ▼
┌───────────┴─────────────────────────────────────────────────────┐
│                    SERVIDOR (Node.js + Express)                 │
│  ┌───────────────────────────┐   ┌─────────────────────────┐    │
│  │  API REST (Controladores) │   │ Servidor Socket.io       │    │
│  │  - Autenticación (JWT)    │   │ - Gestión de salas       │    │
│  │  - Perfil / Docente       │   │ - Eventos de sincronía   │    │
│  │  - Misiones / Retos       │   │ - Registro de resultado  │    │
│  │  - Progresión / Admin     │   │   al finalizar (vía      │    │
│  │                           │   │   capa de servicios)     │    │
│  └─────────────┬─────────────┘   └────────────┬────────────┘    │
│                └───────────────┬───────────────┘                │
│                                ▼                                │
│                  ┌───────────────────────────┐                  │
│                  │   Capa de Servicios /      │                  │
│                  │   Lógica de negocio (M)    │                  │
│                  │   Strategy: evaluadores    │                  │
│                  │   de retos por tipo        │                  │
│                  └─────────────┬─────────────┘                  │
│                                ▼                                │
│                  ┌───────────────────────────┐                  │
│                  │  Repositorios (Repository) │                  │
│                  └─────────────┬─────────────┘                  │
└────────────────────────────────┼─────────────────────────────────┘
▼
┌─────────────────────┐
│   MySQL (gestionado) │
└─────────────────────┘
## 3.3 Componentes principales
## 3.4 Justificación de decisiones tecnológicas
Socket.io se eligió sobre alternativas basadas en listeners de bases de datos documentales (por ejemplo, Firestore) porque RF-019 requiere sincronización de eventos de juego con baja latencia entre varios participantes simultáneos, un caso de uso para el que Socket.io está diseñado de forma nativa (salas, difusión de eventos, reconexión).
MySQL se eligió porque el dominio de MindGame es fuertemente relacional (usuarios, grupos docente-estudiante, misiones, retos, progreso, recompensas, logros), lo que favorece un modelo relacional con integridad referencial sobre un modelo documental.
React + Vite y el hospedaje en Vercel/Render se mantienen por consistencia con el resto de proyectos del programa y por ajustarse a los planes gratuitos disponibles.
# 4. Modelo de datos
## 4.1 Diagrama entidad-relación (conceptual)
Usuario (1)───(N) Progreso ───(N) Mision
│                                   │
│ rol: estudiante/docente/admin     │(1)
│                                    ▼
│                              Reto / Actividad
│
├──(N) Grupo ◄──(1) Docente (subtipo de Usuario)
│        │
│        └──(N) MiembroGrupo ───(1) Usuario (estudiante)
│
├──(N) LogroObtenido ───(1) Logro
├──(N) RecompensaObtenida ───(1) Recompensa
│
└──(N) ParticipacionSala ───(1) Sala ───(1) ActividadGrupal
## 4.2 Entidades principales
Dato pendiente:
• El detalle exacto de columnas, tipos SQL, índices y restricciones (constraints) se definirá en el script de migración durante Sprint 0-1, en conjunto con las reglas numéricas de puntos y niveles aún pendientes en la ERS (Anexo D).
# 5. Diseño de módulos
Cada módulo agrupa un conjunto de RF de la ERS v1.2 y se implementa siguiendo MVC + Repository. A continuación se describe el diseño de cada uno.
## 5.1 Módulo de autenticación
Requisitos cubiertos: RF-001 a RF-004, RF-021, RF-029
Gestiona registro, inicio/cierre de sesión, recuperación de contraseña y emisión de tokens JWT que incluyen el rol del usuario (estudiante, docente, administrador). Un middleware de autorización valida el rol antes de ejecutar operaciones restringidas (RF-029).
## 5.2 Módulo de perfil
Requisitos cubiertos: RF-005, RF-006
CRUD sobre la entidad Perfil; expone endpoints para consultar y actualizar datos de perfil y personalización.
## 5.3 Módulo de contenido y misiones
Requisitos cubiertos: RF-007 a RF-011, RF-024, RF-025
Gestiona la exploración, selección y ejecución de misiones, retos históricos y actividades recreativas. La evaluación de retos utiliza el patrón Strategy: cada tipo de reto (selección múltiple, verdadero/falso, relación de elementos, orden cronológico) implementa una interfaz común EvaluadorDeReto, lo que permite añadir nuevos tipos sin modificar el controlador (RNF-012).
## 5.4 Módulo de convivencia
Requisitos cubiertos: RF-012, RF-013, RF-027
Gestiona misiones y contenidos de convivencia; comparte la infraestructura del módulo de contenido, diferenciándose por el tipo de actividad.
## 5.5 Módulo de progresión
Requisitos cubiertos: RF-014 a RF-017, RF-020, RF-026, RF-028
Contiene la lógica de asignación de puntos, desbloqueo de niveles, recompensas, logros y persistencia del progreso. Expone un servicio central (ServicioDeProgreso) invocado tanto por el módulo de contenido como por el módulo de actividades grupales en tiempo real, evitando duplicar la lógica de puntuación.
## 5.6 Módulo de actividades grupales en tiempo real
Requisitos cubiertos: RF-019
Gestiona la creación de salas, el ingreso/salida de participantes y la sincronización de eventos mediante Socket.io (ver sección 6). Al finalizar la actividad, delega en ServicioDeProgreso el registro de resultados y la asignación de puntos, manteniendo la lógica de negocio fuera de la capa de comunicación en tiempo real.
## 5.7 Módulo docente
Requisitos cubiertos: RF-021 a RF-023
Gestiona la creación de grupos, la generación de códigos de acceso y la consulta de estadísticas agregadas e individuales de los estudiantes asociados. Reutiliza los repositorios de Usuario y Progreso, sin duplicar acceso a datos.
## 5.8 Módulo administrativo
Requisitos cubiertos: RF-024 a RF-027
CRUD sobre misiones, retos, actividades y contenidos de convivencia, protegido por el middleware de autorización de rol administrador.
## 5.9 Patrones de diseño aplicados
# 6. Diseño de la comunicación en tiempo real
La actividad grupal (RF-019) se implementa sobre Socket.io, usando el concepto de sala (room) nativo de la librería para aislar los eventos de cada grupo de participantes.
## 6.1 Flujo de eventos
Cliente A               Servidor Socket.io               Cliente B
│  join_room(salaId)        │                             │
├──────────────────────────►│                             │
│                           │  actualiza ParticipacionSala│
│                           │◄─── join_room(salaId) ──────┤
│  participante_conectado   │                             │
│◄──────────────────────────┼────────────────────────────►│
│                           │                             │
│  (capacidad mínima OK)    │                             │
│◄──── actividad_iniciada ──┼──── actividad_iniciada ────►│
│  evento_progreso          │                             │
├──────────────────────────►│─── evento_progreso ────────►│
│                           │                             │
│◄──── actividad_finalizada ┤ (delega en ServicioDeProgreso)
│                           │                             │
│  (desconexión inesperada) │                             │
├──────────────────────────►│─── participante_desconectado►│
## 6.2 Eventos principales
Dato pendiente:
• Definir el umbral máximo de latencia aceptable (RNF-013) y la estrategia exacta de reconexión (tiempo de espera antes de considerar definitiva una desconexión).
# 7. Diseño de la API REST
La API sigue convenciones REST estándar, con autenticación mediante JWT enviado en el encabezado Authorization. A continuación se listan los grupos de endpoints principales; el detalle completo de parámetros se documentará en la especificación OpenAPI durante Sprint 0-1.
# 8. Diseño de seguridad
Autenticación mediante JWT firmado por el servidor; el token incluye el identificador de usuario y su rol (RNF-003).
Middleware de autorización por rol aplicado a todas las rutas administrativas y docentes, verificando el rol antes de ejecutar la operación (RF-029).
Contraseñas almacenadas mediante hash con función de derivación de clave (por ejemplo, bcrypt), nunca en texto plano.
Comunicación cifrada mediante HTTPS para la API REST y WSS para Socket.io (RIC-001).
Recuperación de contraseña mediante enlace de un solo uso con expiración, sin confirmar la existencia de la cuenta al solicitante (RF-003).
Tratamiento de datos personales alineado con la Ley 1581 de 2012: minimización de datos recolectados, y un mecanismo de aviso/autorización a definir junto con el responsable del proyecto para el caso de usuarios menores de edad (RNF-014).
Dato pendiente:
• Definir el mecanismo operativo de autorización de datos para menores de edad (rol de acudientes o de la institución educativa), en línea con el Anexo D de la ERS.
# 9. Diseño de interfaz de usuario
El frontend en React + Vite implementa tres experiencias diferenciadas visualmente según el rol autenticado (RIU-010), compartiendo componentes base.
Las vistas de administrador y docente se sirven bajo rutas protegidas del cliente (por ejemplo, /docente/*, /admin/*), separadas de la experiencia estándar de estudiante, reforzando RIU-008 y RIU-010 a nivel de interfaz además del control de acceso del backend (RF-029).
# 10. Trazabilidad requisito–componente
# 11. Anexos
## Anexo A — Diagrama de despliegue (infraestructura gratuita)
┌─────────────┐        ┌───────────────────┐        ┌────────────────────┐
│   Vercel    │  HTTPS │  Render / Railway  │  TCP   │  MySQL gestionado  │
│  (Frontend  │───────►│  (Backend Node.js  │───────►│  (plan gratuito)   │
│  React/Vite)│  WSS   │  Express + Socket. │        │                    │
│             │◄──────►│  io)               │        │                    │
└─────────────┘        └───────────────────┘        └────────────────────┘
## Anexo B — Capas del backend
┌──────────────────────────────────────────┐
│  Controladores (rutas Express / eventos   │
│  Socket.io)                                │
├──────────────────────────────────────────┤
│  Servicios (lógica de negocio)            │
│  - ServicioDeProgreso                     │
│  - EvaluadorDeReto (Strategy)              │
├──────────────────────────────────────────┤
│  Repositorios (Repository)                │
├──────────────────────────────────────────┤
│  MySQL                                     │
└──────────────────────────────────────────┘
# Conclusión
Este SDD traduce la ERS MindGame v1.2 en una arquitectura concreta: cliente React responsive, backend Node.js/Express con API REST y canal Socket.io para actividades grupales en tiempo real, persistencia en MySQL mediante el patrón Repository, y evaluación extensible de retos mediante Strategy. El diseño diferencia claramente los tres roles del sistema (estudiante, docente, administrador) tanto en la interfaz como en el control de acceso del backend.
Antes de iniciar la implementación deberán resolverse los puntos marcados como pendientes en este documento: umbral de latencia para tiempo real, esquema exacto de columnas y restricciones de la base de datos, y el mecanismo operativo de autorización de datos de menores conforme a la Ley 1581 de 2012.
Estado recomendado: aprobación preliminar, sujeta a la validación de los puntos pendientes señalados.
--- TABLE 0 ---
Componente | Responsabilidad
Cliente web (React + Vite) | Renderiza la interfaz responsive; consume la API REST y se conecta al servidor Socket.io para actividades en tiempo real.
API REST (Express, capa Controller) | Expone endpoints para autenticación, perfil, contenido, progresión, gestión docente y administración.
Servidor Socket.io | Gestiona salas de actividad grupal, difunde eventos entre participantes y notifica al finalizar la actividad.
Capa de servicios (Model / lógica de negocio) | Contiene las reglas de negocio: asignación de puntos, progresión de niveles, evaluación de retos (patrón Strategy), permisos por rol.
Repositorios (Repository) | Encapsulan el acceso a MySQL; cada entidad principal tiene su propio repositorio, desacoplando la lógica de negocio del motor de base de datos.
Base de datos MySQL | Almacena usuarios, perfiles, grupos, misiones, retos, actividades, progreso, recompensas, logros y salas.
--- TABLE 1 ---
Entidad | Descripción y atributos clave
Usuario | id, nombreCompleto, correo, nombreUsuario, contraseñaHash, rol (estudiante/docente/administrador), edad, grado, fechaRegistro.
Perfil | usuarioId, avatarSeleccionado, personalizaciones (JSON).
Grupo | id, docenteId, nombre, codigoAcceso, fechaCreacion.
MiembroGrupo | grupoId, estudianteId, fechaIngreso.
Mision | id, titulo, descripcion, tipo (histórica/convivencia/recreativa), estado (activa/inactiva), nivelRequerido.
Reto | id, misionId, tipo (selección múltiple, verdadero/falso, relación de elementos, orden cronológico), contenido (JSON), respuestaCorrecta (JSON).
Actividad | id, tipo (recreativa/convivencia/grupal), instrucciones, esTiempoReal (booleano).
Progreso | usuarioId, puntos, nivelActual, misionesCompletadas (relación N:M con Mision), fechaActualizacion.
Recompensa / RecompensaObtenida | condicion (JSON), usuarioId, fechaObtencion.
Logro / LogroObtenido | condicion (JSON), usuarioId, fechaObtencion.
Sala | id, actividadId, estado (esperando/en curso/finalizada), capacidadMinima, fechaCreacion.
ParticipacionSala | salaId, usuarioId, estado (conectado/desconectado), resultado (JSON, opcional).
--- TABLE 2 ---
Patrón | Aplicación en MindGame
MVC | Estructura general del backend: controladores (rutas Express), modelos/servicios (lógica de negocio), vistas (respuestas JSON consumidas por el cliente React).
Repository | Cada entidad principal (Usuario, Mision, Reto, Progreso, Grupo, Sala, etc.) tiene un repositorio propio que encapsula las consultas SQL, permitiendo cambiar el motor de persistencia con impacto controlado (RNF-006).
Strategy | Evaluación de retos según su tipo (selección múltiple, verdadero/falso, relación de elementos, orden cronológico), permitiendo agregar nuevos tipos sin modificar el controlador de retos (RNF-012).
Adapter | Punto de extensión reservado para v2.0: un adaptador de integración académica externa permitirá conectar MindGame con sistemas institucionales (ver backlog v2.0 de la ERS) sin modificar el módulo docente.
--- TABLE 3 ---
Evento | Dirección | Descripción
join_room | Cliente → Servidor | Solicita unirse a una sala de actividad grupal existente o recién creada.
participante_conectado | Servidor → Sala | Notifica a todos los participantes que un nuevo usuario se unió.
actividad_iniciada | Servidor → Sala | Se emite cuando se alcanza la capacidad mínima de participantes.
evento_progreso | Cliente ↔ Servidor ↔ Sala | Transporta las acciones del participante durante la actividad, sincronizadas a los demás.
actividad_finalizada | Servidor → Sala | Indica el cierre de la actividad; dispara el registro de resultados vía ServicioDeProgreso.
participante_desconectado | Servidor → Sala | Notifica la salida o caída de un participante, según RF-019.
--- TABLE 4 ---
Recurso | Endpoints principales | RF relacionados
Autenticación | POST /auth/registro · POST /auth/login · POST /auth/recuperar-password · POST /auth/logout | RF-001 a RF-004
Perfil | GET /perfil · PUT /perfil | RF-005, RF-006
Misiones y retos | GET /misiones · GET /misiones/:id · POST /misiones/:id/retos/:retoId/responder | RF-007 a RF-010
Actividades | GET /actividades · POST /actividades/:id/completar | RF-011 a RF-013
Progreso | GET /progreso · GET /logros | RF-014 a RF-017, RF-020
Docente | POST /docente/grupos · GET /docente/grupos/:id/estudiantes · GET /docente/grupos/:id/estadisticas | RF-021 a RF-023
Administración | CRUD /admin/misiones · CRUD /admin/retos · CRUD /admin/actividades · CRUD /admin/convivencia · CRUD /admin/niveles-recompensas | RF-024 a RF-027
--- TABLE 5 ---
Breakpoint | Rango aproximado | Adaptación principal
Móvil | < 640px | Navegación por pestañas inferiores; una columna; controles táctiles ampliados.
Tablet | 640px – 1024px | Navegación lateral colapsable; dos columnas en pantallas de progreso y estadísticas.
Escritorio | > 1024px | Navegación lateral fija; paneles múltiples visibles simultáneamente (por ejemplo, lista de grupo + detalle de estudiante para el docente).
--- TABLE 6 ---
Requisito (ERS) | Módulo de diseño | Patrón principal
RF-001 a RF-004, RF-021, RF-029 | Módulo de autenticación | MVC + middleware de autorización
RF-005, RF-006 | Módulo de perfil | Repository
RF-007 a RF-011, RF-024, RF-025 | Módulo de contenido y misiones | Strategy (evaluación de retos) + Repository
RF-012, RF-013, RF-027 | Módulo de convivencia | Repository
RF-014 a RF-017, RF-020, RF-026, RF-028 | Módulo de progresión | Repository + servicio centralizado
RF-019 | Módulo de actividades grupales en tiempo real | Socket.io (rooms) + delegación a ServicioDeProgreso
RF-021 a RF-023 | Módulo docente | Repository
RF-024 a RF-027 | Módulo administrativo | MVC + Repository