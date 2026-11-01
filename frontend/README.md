# MindGame - Frontend

Cliente web de MindGame, una plataforma educativa gamificada para estudiantes de colegio: misiones históricas y de convivencia, retos con retroalimentación, progresión (puntos, niveles, recompensas y logros), grupos de docentes y actividades grupales en tiempo real. La interfaz está en español y tiene tres áreas según el rol: estudiante, docente y administrador.

Este documento describe solo el frontend. El servidor está documentado en [`backend/README.md`](../backend/README.md) y los requisitos y el diseño del sistema, en [`docs/`](../docs).

## Contenido

1. [Stack y requisitos](#1-stack-y-requisitos)
2. [Puesta en marcha](#2-puesta-en-marcha)
3. [Estructura de carpetas y convenciones](#3-estructura-de-carpetas-y-convenciones)
4. [Mapa de rutas por rol](#4-mapa-de-rutas-por-rol)
5. [Comunicación con el backend](#5-comunicación-con-el-backend)
6. [Convenciones de código](#6-convenciones-de-código)
7. [Calidad](#7-calidad)
8. [Cuentas y datos de demostración](#8-cuentas-y-datos-de-demostración)
9. [Solución de problemas](#9-solución-de-problemas)
10. [Documentación relacionada](#10-documentación-relacionada)

## 1. Stack y requisitos

| Componente   | Tecnología                          | Versión (`package.json`) |
| ------------ | ----------------------------------- | ------------------------ |
| UI           | React y React DOM                   | `^19.2.8`                |
| Empaquetador | Vite con `@vitejs/plugin-react`     | `^8.2.2` y `^6.1.0`      |
| Enrutado     | `react-router-dom`                  | `^7.18.3`                |
| HTTP         | `axios`                             | `^1.20.0`                |
| Tiempo real  | `socket.io-client`                  | `^4.8.3`                 |
| Iconos       | `react-icons`                       | `^5.7.0`                 |
| Calidad      | ESLint 10 (flat config), Prettier 3 | ver `package.json`       |

Requisitos:

- **Node.js 24**, la versión que usa la integración continua (`.github/workflows/ci.yml`). `package.json` no declara `engines`.
- **npm**; el repositorio versiona `package-lock.json`, por lo que se recomienda `npm ci`.
- El **backend** en ejecución (por defecto en `http://localhost:3000`) para que la aplicación tenga datos y sesión. Ver [`backend/README.md`](../backend/README.md).

El proyecto está escrito en JavaScript (JSX), sin TypeScript. No usa librerías de componentes ni de estilos: los estilos son CSS propio.

## 2. Puesta en marcha

Todos los comandos se ejecutan desde la carpeta `frontend/`.

**1. Instalar las dependencias.**

```bash
npm ci
```

**2. (Opcional) Definir variables de entorno.** El frontend funciona sin ningún `.env` si el backend corre en `http://localhost:3000`. Para apuntar a otro servidor, se crea `frontend/.env` (que está en `.gitignore`; la carpeta incluye un `.env.example` como punto de partida):

```bash
cp .env.example .env
```

| Variable          | Obligatoria | Por defecto                                                                    | Descripción                                                                                                                                                                                                               |
| ----------------- | ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`    | No          | `http://localhost:3000/api`                                                    | URL base de la API REST (incluye el sufijo `/api`). Se admite una ruta relativa (`/api`) cuando un proxy sirve el frontend y la API desde el mismo origen. Se lee en `src/api/api.js`.                                    |
| `VITE_SOCKET_URL` | No          | derivada de `VITE_API_URL` quitando `/api`; si no hay, `http://localhost:3000` | URL del servidor Socket.io. Solo hace falta si el servidor de tiempo real no está en el mismo host que la API. Con una `VITE_API_URL` relativa, el socket se conecta al mismo origen. Se lee en `src/services/socket.js`. |

Vite incorpora estas variables al iniciar, por lo que hay que reiniciar el servidor de desarrollo tras cambiarlas. Solo se exponen al navegador las variables con prefijo `VITE_`: nunca se deben colocar secretos en ellas.

**3. Arrancar el servidor de desarrollo.**

```bash
npm run dev
```

La aplicación queda en `http://localhost:5173`. **El puerto importa:** el backend solo acepta por defecto el origen `http://localhost:5173` (y `http://127.0.0.1:5173`) en su lista de CORS (`CORS_ORIGINS`). Si el 5173 está ocupado, Vite elige otro puerto y el navegador recibirá errores de CORS (403) hasta que se libere el 5173 o se agregue el nuevo origen en el backend. Para que Vite falle en lugar de cambiar de puerto:

```bash
npm run dev -- --strictPort
```

### Scripts de npm

| Script                 | Comando              | Qué hace                                                                   |
| ---------------------- | -------------------- | -------------------------------------------------------------------------- |
| `npm run dev`          | `vite`               | Servidor de desarrollo con recarga en caliente.                            |
| `npm run build`        | `vite build`         | Genera el empaquetado de producción en `dist/`.                            |
| `npm run preview`      | `vite preview`       | Sirve localmente el contenido de `dist/` (requiere haber corrido `build`). |
| `npm run lint`         | `eslint .`           | Analiza el código con ESLint.                                              |
| `npm run format`       | `prettier --write .` | Formatea el código.                                                        |
| `npm run format:check` | `prettier --check .` | Comprueba el formato sin modificar archivos.                               |

## 3. Estructura de carpetas y convenciones

```text
frontend/
├── index.html                  documento base (lang="es", fuente Poppins)
├── vite.config.js              solo el plugin de React
├── eslint.config.js            ESLint flat config
├── public/                     favicon e iconos estáticos
└── src/
    ├── main.jsx                punto de entrada: estilos globales y proveedores
    ├── App.jsx                 renderiza AppRoutes
    ├── index.css               estilos complementarios (p. ej. el marcador de posición del inicio)
    ├── api/                    cliente HTTP y un módulo por recurso del backend
    ├── components/
    │   ├── auth/               tarjeta de autenticación, campo de contraseña, redirección por rol
    │   ├── layout/             Header, Sidebar, MobileNavigation, PageHeader
    │   ├── student/            tarjetas y barras de progreso del estudiante
    │   ├── teacher/            componentes del módulo docente (grupos, código, estadísticas)
    │   ├── admin/              DataTable, formularios de contenido, ConfirmDialog, StatusBadge
    │   ├── realtime/           sala en vivo: lobby, juego, cronómetro, eventos, resultados
    │   └── common/             reservada para componentes comunes (hoy son archivos vacíos)
    ├── constants/              avatares y ruta de inicio por rol
    ├── context/                AuthContext (sesión) y SalaContext (sala en vivo)
    ├── hooks/                  useSalaTiempoReal, useAccionDeSala, useAhora, useDialogA11y
    ├── layouts/                StudentLayout, TeacherLayout, AdminLayout
    ├── pages/
    │   ├── auth/               inicio de sesión, registro y recuperación de contraseña
    │   ├── profile/            perfil (común a todos los roles)
    │   ├── student/            pantallas del estudiante
    │   ├── teacher/            pantallas del docente
    │   ├── admin/              pantallas de administración
    │   └── realtime/           LiveRoomPage (sala en vivo, compartida por estudiante y docente)
    ├── routes/                 AppRoutes y ProtectedRoutes
    ├── services/               socket.js y salaClient.js (Socket.io)
    ├── styles/                 variables, reset, global y responsive
    └── utils/                  lógica pura: progresión, estadísticas, convivencia, sala en tiempo real
```

### Convenciones principales

- **Diseño y estilos.** Los tokens de diseño (colores, espaciados, tipografías) son variables CSS en `src/styles/variables.css`; `reset.css`, `global.css` y `responsive.css` completan la base y se cargan en `main.jsx`. Cada componente o página importa su propio archivo `.css`, con nombres de clase estilo BEM (`app-header__user`). Los puntos de corte de referencia son 768 px (tablet) y 1024 px (escritorio).
- **Instancia única de axios.** Todos los módulos de `src/api/` usan la instancia compartida de `src/api/api.js`, que fija la URL base y adjunta el token (ver [sección 5](#5-comunicación-con-el-backend)).
- **Sesión y roles.** `AuthContext` guarda el usuario y el token y expone `useAuth()` (`user`, `token`, `loading`, `login`, `register`, `logout`). `ProtectedRoutes` exige sesión y, opcionalmente, una lista de roles; a quien no cumple lo redirige a `/login` o a `/`. `RoleRedirect` lleva a cada usuario a su inicio (`constants/roleRoutes.js`).
- **Layouts por rol.** `StudentLayout`, `TeacherLayout` y `AdminLayout` aportan la barra lateral (o la navegación inferior en móvil), el encabezado y el cierre de sesión. Cada uno declara su menú en una constante `NAV_ITEMS`.
- **Capa de tiempo real.** Hay un único socket por sesión, administrado por `SalaProvider` (`context/SalaContext.js`) y consumido con `useSala()`:
  - `services/socket.js` crea el cliente (`autoConnect: false`), resuelve la URL y ofrece `emitirConAck`, que convierte cada evento en una promesa;
  - `services/salaClient.js` es el cliente de salas en JavaScript plano: conecta bajo demanda, traduce los eventos del servidor y vuelve a entrar a la sala tras una caída;
  - `hooks/useSalaTiempoReal.js` expone el estado y las acciones a React;
  - `utils/salaTiempoReal.js` contiene el reducer puro (`salaReducer`), los mensajes en español de cada código de error y utilidades de tiempo, sin React ni red.
- **Accesibilidad.** `hooks/useDialogA11y.js` da a los diálogos modales manejo de foco (entrada, atrapado con Tab y retorno al cerrar), cierre con Escape y cierre por clic en el fondo solo si el clic empieza y termina allí. `components/admin/ConfirmDialog` lo usa y se reutiliza fuera del área de administración (grupos del docente y del estudiante, y la sala en vivo). Los avisos usan `role="alert"` o `role="status"`.
- **Archivos `.js` que usan `createElement`.** `AuthContext.js` y `SalaContext.js` son `.js` y no `.jsx` por convención del proyecto: construyen el proveedor con `createElement`, sin sintaxis JSX.

## 4. Mapa de rutas por rol

Las rutas se declaran en `src/routes/AppRoutes.jsx`. Cualquier ruta desconocida redirige a `/`, que a su vez lleva al inicio del rol del usuario o a `/login`.

### Públicas

| Ruta                     | Pantalla                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `/`                      | Redirección según sesión y rol.                                   |
| `/login`                 | Inicio de sesión.                                                 |
| `/register`              | Registro de estudiante o docente (el docente requiere un código). |
| `/forgot-password`       | Solicitud del enlace de recuperación de contraseña.               |
| `/reset-password/:token` | Nueva contraseña, con el token del enlace recibido.               |

### Cualquier rol autenticado

| Ruta      | Pantalla                                                     |
| --------- | ------------------------------------------------------------ |
| `/perfil` | Consulta y edición del perfil (nombre, edad, grado, avatar). |

### Estudiante (`/estudiante`)

| Ruta                        | Pantalla                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `/estudiante`               | Inicio. Es un marcador de posición: su panel completo está pendiente.                |
| `/estudiante/misiones`      | Lista de misiones (históricas y de convivencia).                                     |
| `/estudiante/misiones/:id`  | Detalle de una misión: historias, retos y actividades.                               |
| `/estudiante/progreso`      | Puntos, nivel y misiones completadas.                                                |
| `/estudiante/logros`        | Logros obtenidos y por conseguir.                                                    |
| `/estudiante/recompensas`   | Recompensas obtenidas y por conseguir.                                               |
| `/estudiante/grupos`        | Grupos del estudiante; permite unirse con el código del docente y salir de un grupo. |
| `/estudiante/en-vivo`       | Actividades en vivo: salas abiertas de sus grupos y entrada por código.              |
| `/estudiante/salas/:salaId` | Sala en vivo (lobby, actividad sincronizada y resultado final).                      |

En el menú lateral del estudiante, "Retos" y "Convivencia" aparecen deshabilitados: todavía no tienen pantalla.

### Docente (`/docente`)

| Ruta                                              | Pantalla                                                        |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `/docente`                                        | Inicio con el resumen de los grupos.                            |
| `/docente/grupos`                                 | Lista de grupos y creación de uno nuevo (genera el código).     |
| `/docente/grupos/:grupoId`                        | Detalle del grupo: código, estudiantes y retiro de estudiantes. |
| `/docente/grupos/:grupoId/estadisticas`           | Estadísticas del grupo.                                         |
| `/docente/grupos/:grupoId/en-vivo`                | Preparación y apertura de una actividad en vivo para el grupo.  |
| `/docente/salas/:salaId`                          | Sala en vivo del docente (control de la actividad).             |
| `/docente/estudiantes/:estudianteId/estadisticas` | Estadísticas de un estudiante.                                  |

### Administrador (`/admin`)

| Ruta                        | Pantalla                                                       |
| --------------------------- | -------------------------------------------------------------- |
| `/admin`                    | Dashboard con el resumen del contenido cargado.                |
| `/admin/misiones`           | Alta, edición, activación y baja de misiones.                  |
| `/admin/retos`              | Retos que el sistema evalúa automáticamente.                   |
| `/admin/actividades`        | Actividades recreativas asociadas a cada misión.               |
| `/admin/contenidos`         | Historias que los estudiantes leen en cada misión.             |
| `/admin/recompensas`        | Recompensas que se desbloquean por puntos o nivel.             |
| `/admin/logros`             | Logros que se ganan por puntos o nivel.                        |
| `/admin/mensajes-positivos` | Mensajes de aliento (convivencia) que reciben los estudiantes. |

En el menú del administrador, "Usuarios" aparece deshabilitado: aún no existe esa pantalla.

## 5. Comunicación con el backend

**API REST.** `src/api/api.js` crea la instancia de axios con `baseURL = VITE_API_URL || "http://localhost:3000/api"`. Un módulo por recurso en `src/api/` (`auth`, `profile`, `missions`, `challenges`, `activities`, `progress`, `rewards`, `achievements`, `groups`, `teacher`, `admin`) envuelve las llamadas y devuelve el cuerpo de la respuesta. Las respuestas del backend usan campos en `snake_case` (`nombre_completo`, `puntos_obtenidos`) y los cuerpos que se envían usan `camelCase` (`nombreCompleto`, `aceptaTratamientoDatos`).

**Token y sesión.**

- Tras iniciar sesión, el JWT se guarda en `localStorage` bajo la clave `mindgame_token`.
- Un interceptor de petición agrega `Authorization: Bearer <token>` a cada llamada.
- Al cargar la aplicación, `AuthProvider` valida el token guardado: si no es un JWT legible lo descarta y, si lo es, pide el perfil a `GET /api/profile`. Si esa llamada falla por cualquier motivo, el token se borra y el usuario vuelve al inicio de sesión.
- Al cerrar sesión se llama a `POST /api/auth/logout` (el servidor no invalida el JWT; solo informa) y siempre se borra el token local, incluso si la llamada falla.
- No hay un interceptor de respuesta global: un 401 por token vencido durante la navegación no cierra la sesión automáticamente. Cada pantalla muestra el error de su llamada y la sesión se vuelve a validar al recargar la página.

**Mensajes de error.** El backend responde errores como `{ message, details? }` con textos en español. Cada pantalla muestra `error.response.data.message` y, si no hay respuesta (por ejemplo, el servidor no está disponible), un texto propio en español como "No pudimos cargar tu perfil.". Los formularios de administración también muestran la lista `details` cuando existe.

**CORS.** El navegador solo puede llamar a la API si el origen del frontend está en la lista `CORS_ORIGINS` del backend (por defecto, `http://localhost:5173`). Es válido tanto para HTTP como para Socket.io.

**Tiempo real.** El socket se conecta al mismo servidor que la API (`VITE_SOCKET_URL` o la URL derivada de `VITE_API_URL`), con `auth: { token }` leído en cada intento de conexión, de modo que las reconexiones usan el token vigente. Solo los roles estudiante y docente pueden conectarse. El cliente reintenta con esperas de 1 a 3 segundos, vuelve a entrar a la sala tras una caída, espera hasta 8 segundos por cada confirmación (ack) y traduce los errores del servidor a mensajes en español. Los errores de conexión que no se arreglan reintentando (`no_autorizado`, `token_invalido`, `rol_no_permitido`, `demasiadas_conexiones`) se informan al usuario. El socket se cierra al cerrar sesión. El protocolo de eventos está documentado en la sección de tiempo real de [`backend/README.md`](../backend/README.md#9-tiempo-real-socketio).

## 6. Convenciones de código

- **ESLint** con configuración plana (`eslint.config.js`): reglas recomendadas de `@eslint/js`, de `eslint-plugin-react-hooks` y de `eslint-plugin-react-refresh` para Vite, más `eslint-config-prettier`. Revisa `.js` y `.jsx`; ignora `dist`.
- **Prettier**, con la configuración única del repositorio (`.prettierrc.json` en la raíz): tabuladores, comillas dobles, punto y coma, comas finales en todo y ancho de línea de 110 caracteres.
- **Transformación JSX automática.** No se importa `React` para usar JSX; solo se importan los hooks y las utilidades que se necesitan.
- **Componentes.** Cada componente vive en su carpeta con su hoja de estilos: `Componente/Componente.jsx` y `Componente/Componente.css`. Los componentes de `auth/` están sueltos en su carpeta. Las pantallas viven en `pages/` con su `.css` al lado.
- **Importaciones.** Los módulos propios se importan, en general, con su extensión (`./Header.jsx`, `../utils/progresion.js`); algunas importaciones de `api/` y de los contextos la omiten, y ambas formas funcionan.
- **Idioma.** El texto de la interfaz, los mensajes de error y los nombres de dominio (`misiones`, `retos`, `grupos`) están en español.
- **Dependencias.** No se agregan dependencias nuevas sin necesidad: el proyecto resuelve estilos, componentes y estado con CSS, React y Context.

## 7. Calidad

```bash
npm run lint
```

```bash
npm run format:check
```

**Integración continua.** El job `frontend` de `.github/workflows/ci.yml` corre en cada pull request y en cada push a `main` (Node 24): instala con `npm ci` y ejecuta `npm run lint`. No ejecuta `npm run build` ni pruebas.

**Pruebas.** El frontend no tiene todavía una suite de pruebas automatizadas (no hay archivos de pruebas ni un script `test`). La verificación es manual: se recomienda recorrer los flujos de cada rol con los datos de demostración siguiendo el guion de [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md) (registro e inicio de sesión, misiones y retos, progreso, grupos, actividad en vivo con un docente y varios estudiantes, y CRUD de administración). Las pruebas de extremo a extremo y la auditoría de responsive y accesibilidad figuran como pendientes en esa guía.

Algunas partes tienen estado parcial y conviene conocerlas antes de revisar:

- `/estudiante` es un marcador de posición.
- Los menús "Retos" y "Convivencia" (estudiante) y "Usuarios" (administrador) están deshabilitados.
- Los archivos de `src/components/common/` y tres componentes del docente (`StudentProgressCard`, `StudentRow` y `TeacherStatCard`) existen como archivos vacíos y no se usan.

## 8. Cuentas y datos de demostración

Los datos de demostración se cargan desde el backend, con la base de datos migrada y generado el cliente de Prisma:

```bash
cd ../backend
```

```bash
npm run db:seed:demo
```

El comando es idempotente. Para borrar solo lo que creó y volver a cargarlo, existe `npm run db:seed:demo:reset` (ver [`backend/README.md`](../backend/README.md#7-base-de-datos)). Las cuentas de demostración (correos, roles, códigos de grupo y contraseña) están documentadas en [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md); este README no las repite. Con el frontend en `http://localhost:5173` y el backend en `http://localhost:3000` no hace falta configurar nada más.

## 9. Solución de problemas

| Síntoma                                                                    | Causa y solución                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pantalla en blanco o "Cargando..." que no termina                          | Abra la consola del navegador. Suele ser el backend apagado o una URL de API incorrecta. Compruebe que `http://localhost:3000/api/health` responde y que `VITE_API_URL` (si existe) apunta a la API.                                                        |
| Vuelve siempre al inicio de sesión o aparecen errores 401                  | El token guardado venció, es inválido o cambió el `JWT_SECRET` del backend. Cierre sesión o borre la clave `mindgame_token` del almacenamiento local del sitio y vuelva a ingresar.                                                                         |
| 403 o "error de CORS" en la consola                                        | El frontend está en un origen que el backend no permite. Por defecto solo se acepta `http://localhost:5173`; si Vite abrió otro puerto (5174, por ejemplo), cierre lo que use el 5173, use `--strictPort` o agregue el origen a `CORS_ORIGINS` del backend. |
| `Network Error` o `ERR_CONNECTION_REFUSED`                                 | El backend no está en ejecución o no escucha en la URL configurada. Inicie `npm run dev` en `backend/`.                                                                                                                                                     |
| La sala en vivo no conecta ("sin conexión", errores de conexión)           | Confirme que el backend corre y que `VITE_SOCKET_URL` (o la URL derivada de `VITE_API_URL`) apunta al servidor correcto. Los administradores no pueden usar salas. Un máximo de 5 pestañas por cuenta puede conectarse al mismo tiempo.                     |
| "Demasiados intentos" al iniciar sesión                                    | El backend limitó los intentos de autenticación. Espere unos minutos o, en una demostración, inicie el backend con `RATE_LIMIT_DISABLED=true`.                                                                                                              |
| Registrar un docente falla con 403                                         | El backend no tiene configurado `DOCENTE_REGISTRATION_CODE`, o el código ingresado es incorrecto.                                                                                                                                                           |
| Cambios que no se reflejan o errores extraños tras actualizar dependencias | Detenga Vite, borre la carpeta de caché `node_modules/.vite` y vuelva a ejecutar `npm run dev`. Si cambió un `.env`, reinicie también el servidor.                                                                                                          |

Para más problemas del servidor (base de datos, variables de entorno, límites), ver la sección de solución de problemas de [`backend/README.md`](../backend/README.md#12-solución-de-problemas).

## 10. Documentación relacionada

- [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md): arranque para demostraciones, cuentas, guion y limitaciones conocidas.
- [`docs/ERS.md`](../docs/ERS.md): especificación de requisitos del software.
- [`docs/SDD.md`](../docs/SDD.md): documento de diseño del software.
- [`docs/PlanDeTrabajo.md`](../docs/PlanDeTrabajo.md): plan de trabajo, sprints y responsables.
- [`backend/README.md`](../backend/README.md): API REST y servidor de tiempo real.
