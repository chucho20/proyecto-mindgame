# MindGame - Backend

API REST y servidor de tiempo real (Socket.io) de MindGame, una plataforma educativa gamificada para estudiantes de colegio: misiones históricas y de convivencia, retos evaluados automáticamente, progresión (puntos, niveles, recompensas y logros), grupos de docentes y actividades grupales en vivo.

Este documento describe solo el backend. El cliente web está documentado en [`frontend/README.md`](../frontend/README.md) y los requisitos y el diseño del sistema, en [`docs/`](../docs).

## Contenido

1. [Qué incluye y stack](#1-qué-incluye-y-stack)
2. [Requisitos previos](#2-requisitos-previos)
3. [Puesta en marcha](#3-puesta-en-marcha)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Scripts de npm](#5-scripts-de-npm)
6. [Arquitectura y estructura de carpetas](#6-arquitectura-y-estructura-de-carpetas)
7. [Base de datos](#7-base-de-datos)
8. [API REST](#8-api-rest)
9. [Tiempo real (Socket.io)](#9-tiempo-real-socketio)
10. [Seguridad](#10-seguridad)
11. [Calidad](#11-calidad)
12. [Solución de problemas](#12-solución-de-problemas)
13. [Documentación relacionada](#13-documentación-relacionada)

## 1. Qué incluye y stack

El backend es una aplicación Node.js en ESM (`"type": "module"`) que expone, en un mismo proceso y un mismo puerto:

- una API REST bajo el prefijo `/api` (autenticación, perfil, contenido, progresión, grupos, módulo docente y administración);
- un servidor Socket.io para las actividades grupales en tiempo real (salas que crea el docente y a las que entran los estudiantes de su grupo).

| Componente     | Tecnología                                                     | Versión (`package.json`)     |
| -------------- | -------------------------------------------------------------- | ---------------------------- |
| Runtime        | Node.js                                                        | 24 (ver requisitos)          |
| Servidor HTTP  | Express                                                        | `^5.2.1`                     |
| Tiempo real    | Socket.io                                                      | `^4.8.3`                     |
| Acceso a datos | Prisma ORM (`@prisma/client`) con `@prisma/adapter-mariadb`    | `^7.10.0`                    |
| Base de datos  | MySQL (migraciones SQL propias; ejecutadas con `mysql2`)       | `mysql2` `^3.24.3`           |
| Autenticación  | `jsonwebtoken` (HS256) y `bcrypt`                              | `^9.0.3` y `^6.0.0`          |
| Seguridad HTTP | `helmet`, `cors`, `express-rate-limit`                         | `^8.3.0`, `^2.8.6`, `^8.7.1` |
| Correo         | `nodemailer`                                                   | `^10.1.7`                    |
| Configuración  | `dotenv`                                                       | `^17.4.2`                    |
| Calidad        | ESLint 10 (flat config), Prettier 3, `nodemon` para desarrollo | ver `package.json`           |

## 2. Requisitos previos

- **Node.js 24.** Es la versión que usa la integración continua (`.github/workflows/ci.yml`) y la guía de demostración. El código importa directamente el cliente de Prisma generado como TypeScript (`src/generated/prisma/client.ts`), por lo que necesita el soporte nativo de archivos `.ts` de Node. `package.json` no declara `engines`.
- **npm** (se incluye con Node) y un `package-lock.json` versionado: usar `npm ci` para instalaciones reproducibles.
- **MySQL** en ejecución, con un usuario que pueda crear tablas en la base de datos del proyecto.
- Un terminal con acceso al cliente `mysql` (o cualquier herramienta equivalente) para crear la base de datos vacía.

## 3. Puesta en marcha

Todos los comandos se ejecutan desde la carpeta `backend/`.

**1. Instalar las dependencias.**

```bash
npm ci
```

`package.json` define `allowScripts` para `bcrypt`, `prisma` y `@prisma/engines`: los scripts de instalación de esos paquetes deben poder ejecutarse para que queden operativos.

**2. Crear el archivo `.env`.** La carpeta incluye un `.env.example` como punto de partida:

```bash
cp .env.example .env
```

Después se completan, como mínimo, los siguientes valores (la referencia completa está en la [sección 4](#4-variables-de-entorno)):

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=<usuario_mysql>
DB_PASSWORD=<contraseña_mysql>
DB_NAME=mindgame
JWT_SECRET=<secreto_aleatorio_de_al_menos_32_caracteres>
ADMIN_EMAIL=<correo_del_administrador>
ADMIN_PASSWORD=<contraseña_del_administrador>
DOCENTE_REGISTRATION_CODE=<codigo_para_registrar_docentes>
```

Para generar un `JWT_SECRET` con suficiente entropía:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`.env` está en `.gitignore`: no se versiona nunca.

**3. Crear la base de datos vacía.** Las migraciones crean las tablas, pero no la base de datos:

```sql
CREATE DATABASE mindgame CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

El nombre debe coincidir con `DB_NAME`.

**4. Aplicar las migraciones.**

```bash
npm run db:migrate
```

**5. Generar el cliente de Prisma.** El cliente vive en `src/generated/prisma`, está en `.gitignore` y hay que generarlo después de clonar y cada vez que cambie `prisma/schema.prisma`. Es necesario antes de arrancar el servidor, de ejecutar `npm run routes:audit` o el seeder de demostración (todos importan el cliente).

```bash
npx prisma generate --config prisma7.config.ts
```

`prisma7.config.ts` arma la URL de conexión a partir de las variables `DB_*`, de modo que no existe ni se usa `DATABASE_URL`. Prisma 7.10 detecta ese archivo por sí solo, pero la integración continua lo pasa de forma explícita con `--config`, y esta guía hace lo mismo.

**6. Cargar los datos iniciales** (administrador y niveles; es idempotente):

```bash
npm run db:seed
```

**7. (Opcional) Cargar datos de demostración**: docentes, estudiantes, misiones, grupos y progreso de ejemplo. Las cuentas y el guion de uso están en [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md).

```bash
npm run db:seed:demo
```

**8. Arrancar el servidor.**

```bash
npm run dev
```

`npm run dev` usa `nodemon` y reinicia ante cambios; para ejecutar sin recarga se usa `npm start`. Por defecto escucha en `http://localhost:3000`. Para comprobar que responde:

```bash
curl http://localhost:3000/api/health
```

La respuesta esperada es `{"ok":true,"message":"MindGame API funcionando"}`.

El frontend en desarrollo debe abrirse en `http://localhost:5173`: es el único origen que acepta el CORS por defecto (ver [sección 10](#10-seguridad)).

## 4. Variables de entorno

Las variables se leen de `backend/.env` (mediante `dotenv`) o del entorno del proceso. La validación central está en `src/config/env.js`; los scripts de `database/` y `prisma7.config.ts` leen directamente las variables `DB_*`.

La columna "Obligatoria" distingue lo que hace falta siempre ("Sí"), lo que solo es exigido por el servidor en producción ("Producción") y lo opcional ("No"). Con `NODE_ENV=production`, una configuración inválida detiene el arranque; en desarrollo se emite un aviso y el servidor continúa.

### Base de datos

| Variable      | Obligatoria | Por defecto | Descripción                                                                               |
| ------------- | ----------- | ----------- | ----------------------------------------------------------------------------------------- |
| `DB_HOST`     | Sí          | -           | Host de MySQL. Lo usan la API, las migraciones, los seeders y la configuración de Prisma. |
| `DB_PORT`     | Sí          | -           | Puerto de MySQL (normalmente `3306`).                                                     |
| `DB_USER`     | Sí          | -           | Usuario de MySQL.                                                                         |
| `DB_PASSWORD` | Sí          | -           | Contraseña de MySQL.                                                                      |
| `DB_NAME`     | Sí          | -           | Nombre de la base de datos. Debe existir antes de migrar.                                 |

Si falta alguna de estas variables o `JWT_SECRET`, el servidor termina con un mensaje que lista las que faltan.

### Servidor, CORS y transporte

| Variable          | Obligatoria | Por defecto                                                                   | Descripción                                                                                                                                                                                          |
| ----------------- | ----------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`        | No          | `development`                                                                 | `production` activa las validaciones estrictas, HSTS, logs sin traza y la regla de envío de correo. `test` desactiva los límites de intentos.                                                        |
| `PORT`            | No          | `3000`                                                                        | Puerto HTTP (API y Socket.io).                                                                                                                                                                       |
| `CORS_ORIGINS`    | Producción  | `http://localhost:5173`, `http://127.0.0.1:5173` y el valor de `FRONTEND_URL` | Orígenes del frontend permitidos, completos y separados por coma (por ejemplo `https://app.example.com`). No admite `*`. Aplica a HTTP y a Socket.io.                                                |
| `FRONTEND_URL`    | No          | `http://localhost:5173`                                                       | URL pública del frontend. Se usa para construir el enlace de restablecimiento de contraseña (`<FRONTEND_URL>/reset-password/<token>`) y se suma a la lista de CORS cuando `CORS_ORIGINS` está vacío. |
| `TRUST_PROXY`     | No          | desactivado                                                                   | Detrás de un proxy inverso: número de saltos de confianza (`1`) o un valor de Express (`loopback`, `10.0.0.0/8`). `true` equivale a `1`. Sin esto, todas las peticiones comparten la IP del proxy.   |
| `FORCE_HTTPS`     | No          | `false`                                                                       | Con `true` (o `1`) se rechazan con 403 las peticiones que no lleguen por HTTPS (excepto `/api/health`) y las conexiones Socket.io que no sean WSS. Requiere `TRUST_PROXY` detrás de un proxy TLS.    |
| `JSON_BODY_LIMIT` | No          | `100kb`                                                                       | Tamaño máximo del cuerpo JSON, en el formato de la librería `bytes` (`100kb`, `1mb`).                                                                                                                |

### Autenticación

| Variable         | Obligatoria | Por defecto    | Descripción                                                                                                                                                                                                                                        |
| ---------------- | ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`     | Sí          | -              | Secreto de firma HS256. Se considera débil si tiene menos de 32 caracteres, menos de 12 caracteres distintos o contiene palabras predecibles (`secret`, `changeme`, `password`, `mindgame`...). En producción un secreto débil impide el arranque. |
| `JWT_EXPIRES_IN` | No          | `1d`           | Vigencia del token: segundos (`3600`) o número con unidad `s`, `m`, `h`, `d` o `w`. Más de 7 días es un error en producción (aviso en desarrollo). `0` no es válido.                                                                               |
| `JWT_ISSUER`     | No          | `mindgame-api` | Claim `iss` que se firma y se exige al verificar. Cambiarlo invalida los tokens ya emitidos.                                                                                                                                                       |
| `JWT_AUDIENCE`   | No          | `mindgame-app` | Claim `aud` que se firma y se exige al verificar. Cambiarlo invalida los tokens ya emitidos.                                                                                                                                                       |
| `BCRYPT_ROUNDS`  | No          | `12`           | Costo de bcrypt para las contraseñas nuevas (entero entre 10 y 15). Los hashes existentes siguen siendo válidos.                                                                                                                                   |

### Límite de intentos (rate limiting)

Los límites se guardan en memoria del proceso y se aplican solo a los endpoints de autenticación. Todos aceptan enteros positivos.

| Variable                                | Obligatoria | Por defecto           | Descripción                                                                         |
| --------------------------------------- | ----------- | --------------------- | ----------------------------------------------------------------------------------- |
| `RATE_LIMIT_DISABLED`                   | No          | `false`               | Con `true` (o `1`) desactiva todos los límites. Útil para demostraciones y pruebas. |
| `RATE_LIMIT_WINDOW_MS`                  | No          | `900000` (15 minutos) | Duración de la ventana de conteo, en milisegundos (mínimo `1000`).                  |
| `LOGIN_RATE_LIMIT_MAX`                  | No          | `30`                  | Inicios de sesión fallidos por IP dentro de la ventana.                             |
| `LOGIN_RATE_LIMIT_TOTAL_MAX`            | No          | `300`                 | Todos los intentos de inicio de sesión por IP (exitosos o no).                      |
| `LOGIN_ACCOUNT_RATE_LIMIT_MAX`          | No          | `8`                   | Inicios de sesión fallidos por combinación de cuenta (correo) e IP.                 |
| `REGISTER_RATE_LIMIT_MAX`               | No          | `30`                  | Registros por IP.                                                                   |
| `PASSWORD_RESET_RATE_LIMIT_MAX`         | No          | `10`                  | Solicitudes de recuperación y de restablecimiento de contraseña por IP.             |
| `PASSWORD_RESET_ACCOUNT_RATE_LIMIT_MAX` | No          | `3`                   | Solicitudes de recuperación por correo, desde cualquier IP.                         |

### Correo y restablecimiento de contraseña

| Variable                  | Obligatoria | Por defecto                          | Descripción                                                           |
| ------------------------- | ----------- | ------------------------------------ | --------------------------------------------------------------------- |
| `SMTP_HOST`               | No          | vacío                                | Servidor SMTP.                                                        |
| `SMTP_PORT`               | No          | vacío                                | Puerto SMTP. Con `465` se usa conexión segura implícita.              |
| `SMTP_USER`               | No          | vacío                                | Usuario SMTP.                                                         |
| `SMTP_PASSWORD`           | No          | vacío                                | Contraseña SMTP.                                                      |
| `SMTP_FROM`               | No          | `MindGame <no-reply@mindgame.local>` | Remitente de los correos.                                             |
| `RESET_TOKEN_EXPIRES_MIN` | No          | `30`                                 | Vigencia del enlace de restablecimiento, en minutos (entre 1 y 1440). |

El correo de restablecimiento solo se envía por SMTP cuando `NODE_ENV=production` y las cuatro variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASSWORD` están definidas. En cualquier otro caso fuera de producción, el enlace se imprime en la consola del servidor (modo desarrollo); en producción sin SMTP completo no se envía nada y se registra un error.

### Registro de docentes, administrador y salas

| Variable                    | Obligatoria | Por defecto                                     | Descripción                                                                                                                                                                                                           |
| --------------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DOCENTE_REGISTRATION_CODE` | No          | vacío                                           | Código que debe presentar quien se registra como docente (`codigoDocente`). Vacío significa registro de docentes deshabilitado (responde 403). Se compara en tiempo constante.                                        |
| `ADMIN_EMAIL`               | No          | vacío                                           | Correo del administrador que crea `npm run db:seed`. Si falta junto con `ADMIN_PASSWORD`, ese paso se omite. Solo lo lee el seeder.                                                                                   |
| `ADMIN_PASSWORD`            | No          | vacío                                           | Contraseña del administrador inicial. Solo la lee el seeder.                                                                                                                                                          |
| `SALA_GRACIA_ESTUDIANTE_MS` | No          | `30000`                                         | Tiempo que se espera a un estudiante desconectado antes de darlo por salido de la sala.                                                                                                                               |
| `SALA_GRACIA_DOCENTE_MS`    | No          | `60000`                                         | Tiempo que se espera al docente desconectado antes de cerrar la sala. El frontend define estos mismos valores como constantes (`frontend/src/utils/salaTiempoReal.js`): si se cambian aquí, conviene revisarlas allá. |
| `DEMO_PASSWORD`             | No          | ver [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md) | Contraseña de las cuentas que crea `npm run db:seed:demo` (entre 8 y 72 caracteres). Solo la lee el seeder de demostración.                                                                                           |

### Mínimo para producción

Con `NODE_ENV=production` el servidor exige, además de `DB_*`: un `JWT_SECRET` fuerte, `CORS_ORIGINS` explícito y una vigencia de token de 7 días o menos. Se recomienda también `TRUST_PROXY` y `FORCE_HTTPS=true` detrás de un proxy TLS, y la configuración SMTP completa si se necesita recuperación de contraseña. Más detalles en la [sección 10](#10-seguridad).

## 5. Scripts de npm

| Script                       | Comando real                                     | Qué hace                                                                                                                        |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                | `nodemon src/server.js`                          | Arranca la API y Socket.io con recarga automática.                                                                              |
| `npm start`                  | `node src/server.js`                             | Arranca el servidor sin recarga.                                                                                                |
| `npm run db:migrate`         | `node database/migrate.js`                       | Aplica las migraciones SQL pendientes.                                                                                          |
| `npm run db:seed`            | `001_admin_seed.js` y `002_niveles_seed.js`      | Crea el administrador (si `ADMIN_EMAIL` y `ADMIN_PASSWORD` están definidas) y los niveles iniciales. Idempotente.               |
| `npm run db:seed:demo`       | `node database/seeders/003_demo_seed.js`         | Carga los datos de demostración. Idempotente; se niega a correr con `NODE_ENV=production`.                                      |
| `npm run db:seed:demo:reset` | `node database/seeders/003_demo_seed.js --reset` | Elimina solo los datos que creó el seeder de demostración.                                                                      |
| `npm run db:studio`          | `prisma studio`                                  | Abre Prisma Studio para inspeccionar la base de datos.                                                                          |
| `npm run routes:audit`       | `node scripts/listar-rutas.js`                   | Lista todas las rutas con su sesión y roles, y falla si una ruta sensible queda sin protección. No abre el servidor ni la base. |
| `npm run lint`               | `eslint .`                                       | Analiza el código con ESLint.                                                                                                   |
| `npm run format`             | `prettier --write .`                             | Formatea el código.                                                                                                             |
| `npm run format:check`       | `prettier --check .`                             | Comprueba el formato sin modificar archivos.                                                                                    |

Notas:

- Para pasar el argumento de producción al seeder de demostración (no recomendado sobre datos reales): `npm run db:seed:demo -- --force-produccion`.
- `npm run routes:audit -- --json` entrega la misma matriz de rutas en JSON, para otras herramientas.
- Los comandos de Prisma que no tienen script se ejecutan con `npx`: `npx prisma generate --config prisma7.config.ts` y `npx prisma validate --config prisma7.config.ts`.

## 6. Arquitectura y estructura de carpetas

### Capas

Cada petición REST atraviesa las mismas capas, con responsabilidades separadas:

```text
Petición HTTP
  -> middlewares globales (HTTPS, helmet, origen/CORS, límites de intentos, JSON)
  -> routes        define la URL y encadena authMiddleware y requireRole(...)
  -> controllers   traduce HTTP: lee req, llama al servicio, responde con el status
  -> services      reglas de negocio y validaciones (lanzan AppError)
  -> repositories  único lugar que habla con Prisma
  -> Prisma + adaptador MariaDB -> MySQL
```

- **routes**: un archivo por módulo (`auth`, `profile`, `mission`, `progress`, `admin`, `teacher`, `grupo`). `src/app.js` los monta y exporta la lista `MONTAJES`, que también usa `npm run routes:audit`.
- **controllers**: delgados. Cada handler hace `try/catch` y delega el error en `handleError`.
- **services**: concentran la lógica de dominio (progresión, evaluación de retos, grupos, estadísticas docentes, salas en tiempo real).
- **repositories**: capa anticorrupción entre Prisma y el resto del código. Cada repositorio traduce los modelos camelCase de Prisma a filas en snake_case mediante mapeadores explícitos `aFilaXxx` (por ejemplo `aFilaMision`), de modo que los servicios y las respuestas JSON conservan el contrato `snake_case` original (el de las consultas SQL anteriores a Prisma). También normalizan ids (`normalizarId`) y reconocen violaciones de unicidad (`esViolacionUnica`).

### Manejo de errores

- `utils/AppError.js`: error de negocio con `message`, `statusCode` (por defecto 400) y `details` (arreglo de mensajes de validación).
- `utils/handleError.js`: lo usan los controllers. Si recibe un `AppError`, responde `{ message, details? }` con su status; cualquier otro error se registra (con secretos redactados por `utils/logger.js`) y se responde un 500 genérico, sin detalles de SQL ni trazas.
- `middlewares/error.middleware.js`: cierre de la cadena de Express. Responde `404` para rutas inexistentes y convierte los errores de lectura del cuerpo (JSON mal formado, cuerpo demasiado grande, codificación no soportada) en respuestas JSON con mensajes fijos.

### Patrón Strategy para los retos

`services/evaluadores/` implementa la evaluación automática de retos. Cada tipo tiene su evaluador (`SeleccionMultipleEvaluador`, `VerdaderoFalsoEvaluador`, `RelacionElementosEvaluador`, `OrdenCronologicoEvaluador`), todos con el contrato `evaluar(reto, respuesta) -> { esCorrecto, puntosObtenidos }` documentado en `EvaluadorDeReto.js`. `evaluadorRegistry.js` mapea `reto.tipo` al evaluador y `reto.service.js` lo obtiene con `obtenerEvaluador(tipo)`. Agregar un tipo nuevo implica un archivo evaluador, una línea en el registro y ampliar el enum de tipos (columna `retos.tipo` y `TipoReto` en `prisma/schema.prisma`).

### Sockets

La capa de tiempo real separa el transporte de la lógica:

- `sockets/game.socket.js`: cableado de Socket.io (autenticación del handshake, registro de eventos, límite de ritmo, cierre de sesiones vencidas).
- `services/sala.service.js`: reglas de las salas; no conoce a `io`, difunde mediante un "emisor" que registra `game.socket.js`.
- `sockets/salas.manager.js`: registro en memoria de salas, participantes y temporizadores de gracia.
- `middlewares/socketAuth.middleware.js`: valida el JWT del handshake.

### Estructura de carpetas

```text
backend/
├── database/
│   ├── migrate.js                 ejecutor de migraciones SQL
│   ├── migrations/                001_...sql a 025_...sql
│   └── seeders/                   001_admin, 002_niveles, 003_demo
├── prisma/
│   └── schema.prisma              modelos de Prisma (el cliente se genera aparte)
├── prisma7.config.ts              configuración de Prisma 7 (URL desde DB_*)
├── scripts/
│   └── listar-rutas.js            auditoría de rutas (npm run routes:audit)
└── src/
    ├── server.js                  HTTP + Socket.io; punto de entrada
    ├── app.js                     Express: middlewares, rutas y errores
    ├── config/                    env.js (variables), prisma.js (cliente + adaptador)
    ├── constants/                 avatares, convivencia, límites de salas
    ├── controllers/               un controller por módulo
    ├── middlewares/               auth, role, security, rateLimit, error, socketAuth
    ├── repositories/              acceso a datos con Prisma (aFilaXxx)
    ├── routes/                    un router por módulo
    ├── services/                  reglas de negocio
    │   └── evaluadores/           Strategy de evaluación de retos + registro
    ├── sockets/                   game.socket.js, salas.manager.js
    ├── utils/                     AppError, handleError, jwt, password, validators, logger...
    └── generated/prisma/          cliente generado (en .gitignore)
```

## 7. Base de datos

### Migraciones

El esquema se gestiona con **migraciones SQL propias**, no con Prisma Migrate: Prisma se usa únicamente como ORM en tiempo de ejecución.

- Los archivos están en `database/migrations/` y se nombran con un prefijo numérico (`001_create_usuarios.sql` ... `025_create_participaciones_grupales.sql`).
- `database/migrate.js` conecta con `mysql2`, crea la tabla de control `schema_migrations` si no existe, calcula las migraciones pendientes (archivos `.sql` ordenados por nombre que no figuran en esa tabla), las ejecuta una por una y registra cada nombre al terminar. Volver a ejecutarlo no repite nada.
- Cada archivo se envía como un único lote y no se ejecuta dentro de una transacción: si una migración falla a mitad, MySQL puede haber aplicado parte de ella y el nombre no queda registrado. Conviene mantener cada migración pequeña e idempotente (`CREATE TABLE IF NOT EXISTS`).
- La sesión se fija en UTC (`SET time_zone = '+00:00'`), igual que el adaptador de Prisma, para que `DEFAULT CURRENT_TIMESTAMP` y los valores que escribe Prisma compartan la misma referencia.
- Para agregar una migración se crea el siguiente archivo numerado y se actualiza a mano `prisma/schema.prisma` para reflejarla. La integración continua valida la sintaxis del schema (`prisma validate`), pero no que coincida con la base de datos real.
- `prisma7.config.ts` declara `migrations.path: "prisma/migrations"`, carpeta que no existe ni se usa.

### Modelos (`prisma/schema.prisma`)

Los modelos se mapean a tablas en snake_case y plural mediante `@@map` (por ejemplo, `Usuario` es la tabla `usuarios`).

| Dominio                 | Modelos                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Usuarios y sesión       | `Usuario` (roles `estudiante`, `docente`, `administrador`), `PasswordReset`                          |
| Contenido               | `Mision` (categoría `historica` o `convivencia`), `Historia`, `Reto`, `Actividad`, `MensajePositivo` |
| Progreso del estudiante | `ProgresoMision`, `HistoriaCompletada`, `IntentoReto`, `ActividadCompletada`                         |
| Progresión              | `Nivel`, `Recompensa`, `RecompensaObtenida`, `Logro`, `LogroObtenido`                                |
| Grupos y tiempo real    | `Grupo`, `GrupoEstudiante`, `Sala`, `ParticipacionGrupal`                                            |

Los retos admiten los tipos `seleccion_multiple`, `verdadero_falso`, `relacion_elementos` y `orden_cronologico`. Las recompensas y los logros se desbloquean por `puntos` o por `nivel`. Una sala pasa por los estados `esperando`, `en_curso`, `finalizada` o `cerrada`.

### Cliente de Prisma 7

- El generador es `prisma-client` y emite TypeScript en `src/generated/prisma`; esa carpeta no se versiona. `src/config/prisma.js` importa `client.ts` directamente.
- Prisma 7 exige un _driver adapter_. Para MySQL se usa `@prisma/adapter-mariadb` (no existe un adaptador `mysql` oficial): el driver MariaDB es compatible con el protocolo de MySQL. La conexión sale de las variables `DB_*`.
- `schema.prisma` no declara la URL de la base de datos; la aporta `prisma7.config.ts`.

### Seeders

| Seeder                | Qué hace                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `001_admin_seed.js`   | Crea el usuario administrador con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (nombre de usuario `admin`). Se omite si faltan las variables o si el correo ya existe.                                        |
| `002_niveles_seed.js` | Inserta los niveles 1 a 5 (0, 100, 250, 500 y 1000 puntos) con `INSERT IGNORE`, sin pisar umbrales ajustados. La migración `023` inserta los mismos valores en bases nuevas.                      |
| `003_demo_seed.js`    | Datos de demostración: docentes, estudiantes, misiones, grupos y progreso. El progreso se genera con los mismos servicios de la aplicación, por lo que puntos, niveles y logros son consistentes. |

El seeder de demostración solo agrega filas, es idempotente y se niega a ejecutarse con `NODE_ENV=production` (salvo `--force-produccion`). Para borrar únicamente lo que creó y volver a cargarlo:

```bash
npm run db:seed:demo:reset
```

```bash
npm run db:seed:demo
```

Las cuentas, los códigos de grupo y el procedimiento completo están en [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md).

## 8. API REST

El listado completo y vigente de rutas se obtiene con `npm run routes:audit` (74 rutas al momento de escribir este documento). Resumen por grupo:

| Grupo                | Prefijo                                                             | Acceso                                                | Contenido                                                                                                                    |
| -------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Salud                | `/api/health`                                                       | Pública                                               | Comprobación de que el servicio responde.                                                                                    |
| Autenticación        | `/api/auth`                                                         | Pública                                               | Registro, inicio y cierre de sesión, recuperación y restablecimiento de contraseña.                                          |
| Perfil               | `/api/profile`                                                      | Cualquier usuario autenticado                         | Consultar y actualizar el propio perfil.                                                                                     |
| Misiones y contenido | `/api/misiones`, `/api/historias`, `/api/retos`, `/api/actividades` | Autenticado; las acciones de juego, solo `estudiante` | Explorar misiones, historias, retos y actividades; iniciar misión, completar historia, responder reto y completar actividad. |
| Progresión           | `/api/progreso`, `/api/recompensas`, `/api/logros`                  | `estudiante`                                          | Puntos, nivel, recompensas y logros del estudiante.                                                                          |
| Grupos (estudiante)  | `/api/grupos`                                                       | `estudiante`                                          | Unirse a un grupo con el código, listar los propios y salir.                                                                 |
| Docente              | `/api/docente`                                                      | `docente`                                             | Crear y consultar grupos, estudiantes, estadísticas de grupo y de estudiante, actividades disponibles para salas.            |
| Administración       | `/api/admin`                                                        | `administrador`                                       | Estadísticas y CRUD de misiones, historias, retos, actividades, recompensas, logros y mensajes positivos.                    |

### Rutas principales

**Autenticación** (`/api/auth`, públicas):

| Método | Ruta               | Descripción                                                                          |
| ------ | ------------------ | ------------------------------------------------------------------------------------ |
| POST   | `/register`        | Crea una cuenta de `estudiante` o `docente` (este último requiere `codigoDocente`).  |
| POST   | `/login`           | Devuelve `{ token, user }`.                                                          |
| POST   | `/logout`          | Respuesta informativa; el JWT no se invalida en el servidor, el cliente lo descarta. |
| POST   | `/forgot-password` | Solicita el enlace de restablecimiento. Responde igual exista o no el correo.        |
| POST   | `/reset-password`  | Cambia la contraseña con el token recibido (un solo uso).                            |

**Perfil, misiones y progresión** (requieren `Authorization`):

| Método   | Ruta                                                    | Rol          |
| -------- | ------------------------------------------------------- | ------------ |
| GET, PUT | `/api/profile`                                          | Cualquiera   |
| GET      | `/api/misiones` (filtro opcional `?categoria=`)         | Cualquiera   |
| GET      | `/api/misiones/:id`                                     | Cualquiera   |
| POST     | `/api/misiones/:id/iniciar`                             | `estudiante` |
| GET      | `/api/misiones/:id/historias`, `/retos`, `/actividades` | Cualquiera   |
| POST     | `/api/historias/:id/completar`                          | `estudiante` |
| POST     | `/api/retos/:id/responder`                              | `estudiante` |
| POST     | `/api/actividades/:id/completar`                        | `estudiante` |
| GET      | `/api/progreso`, `/api/recompensas`, `/api/logros`      | `estudiante` |

**Grupos y docente:**

| Método | Ruta                                                | Rol          | Descripción                                              |
| ------ | --------------------------------------------------- | ------------ | -------------------------------------------------------- |
| POST   | `/api/grupos/unirse`                                | `estudiante` | Se une a un grupo con `{ "codigo": "..." }`.             |
| GET    | `/api/grupos/mios`                                  | `estudiante` | Grupos a los que pertenece.                              |
| DELETE | `/api/grupos/mios/:id`                              | `estudiante` | Abandona un grupo.                                       |
| POST   | `/api/docente/grupos`                               | `docente`    | Crea un grupo (`{ "nombre": "..." }`); genera el código. |
| GET    | `/api/docente/grupos`, `/api/docente/grupos/:id`    | `docente`    | Lista y detalle de los grupos propios.                   |
| GET    | `/api/docente/grupos/:id/estudiantes`               | `docente`    | Estudiantes del grupo.                                   |
| DELETE | `/api/docente/grupos/:id/estudiantes/:estudianteId` | `docente`    | Retira a un estudiante del grupo.                        |
| GET    | `/api/docente/grupos/:id/estadisticas`              | `docente`    | Estadísticas agregadas del grupo.                        |
| GET    | `/api/docente/estudiantes/:id/estadisticas`         | `docente`    | Estadísticas de un estudiante.                           |
| GET    | `/api/docente/actividades`                          | `docente`    | Actividades activas, para elegir al crear una sala.      |

**Administración** (`administrador`): `GET /api/admin/stats` y, para cada recurso (`misiones`, `historias`, `retos`, `actividades`, `recompensas`, `logros`, `mensajes-positivos`), el mismo conjunto de rutas:

| Método | Ruta                              | Descripción                                                                                                        |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/admin/<recurso>`            | Lista (historias, retos y actividades aceptan `?misionId=`).                                                       |
| GET    | `/api/admin/<recurso>/:id`        | Detalle.                                                                                                           |
| POST   | `/api/admin/<recurso>`            | Crea.                                                                                                              |
| PUT    | `/api/admin/<recurso>/:id`        | Actualiza.                                                                                                         |
| PUT    | `/api/admin/<recurso>/:id/estado` | Cambia el estado con `{ "estado": "activa" }` o `{ "estado": "inactiva" }` (los retos usan `activo` e `inactivo`). |
| DELETE | `/api/admin/<recurso>/:id`        | Elimina.                                                                                                           |

### Convenciones

- **Formato**: JSON. Las respuestas usan campos en `snake_case` (`nombre_completo`, `created_at`, `puntos_obtenidos`) y envuelven el recurso en una clave (`{ "misiones": [...] }`, `{ "grupo": {...} }`). Los cuerpos de las peticiones REST usan nombres en `camelCase` (por ejemplo `nombreCompleto`, `nombreUsuario`, `aceptaTratamientoDatos`, `codigoDocente`, `misionId`, `respuestaCorrecta`); ante la duda, el validador del servicio correspondiente es la fuente de verdad.
- **Autenticación**: cabecera `Authorization: Bearer <token>`. El token se obtiene en `POST /api/auth/login`.
- **Errores**: siempre JSON con la forma `{ "message": "texto en español", "details": ["..."] }`; `details` solo aparece cuando hay mensajes de validación.
- **Códigos de estado**:

| Código | Significado                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 200    | Operación correcta.                                                                                                           |
| 201    | Recurso creado (registro, grupos, entrada a un grupo por primera vez).                                                        |
| 400    | Datos inválidos (con `details`), JSON mal formado o enlace de restablecimiento inválido.                                      |
| 401    | Falta el token, es inválido o venció; el usuario ya no existe o cambió de rol; credenciales incorrectas en login.             |
| 403    | Rol sin permiso, origen CORS no permitido, conexión no HTTPS con `FORCE_HTTPS`, o código de docente inválido o no habilitado. |
| 404    | Recurso inexistente (o ajeno, en recursos con dueño) o ruta no encontrada.                                                    |
| 409    | Conflicto, por ejemplo correo o nombre de usuario ya registrados.                                                             |
| 413    | Cuerpo de la petición demasiado grande.                                                                                       |
| 415    | Codificación o juego de caracteres del cuerpo no soportado.                                                                   |
| 429    | Demasiados intentos (límite de autenticación).                                                                                |
| 500    | Error inesperado; el mensaje es genérico y el detalle solo queda en el log del servidor.                                      |

### Ejemplos con `curl`

Registro de un estudiante:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCompleto": "Nombre Apellido",
    "correo": "estudiante@example.com",
    "nombreUsuario": "estudiante.ejemplo",
    "password": "<contraseña_de_al_menos_8_caracteres>",
    "rol": "estudiante",
    "aceptaTratamientoDatos": true
  }'
```

Inicio de sesión (la respuesta contiene `token` y `user`):

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "correo": "estudiante@example.com", "password": "<contraseña>" }'
```

Consulta autenticada:

```bash
curl http://localhost:3000/api/misiones \
  -H "Authorization: Bearer <TOKEN>"
```

Unirse a un grupo con el código que entregó el docente:

```bash
curl -X POST http://localhost:3000/api/grupos/unirse \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "codigo": "<CODIGO_DEL_GRUPO>" }'
```

Creación de una misión como administrador:

```bash
curl -X POST http://localhost:3000/api/admin/misiones \
  -H "Authorization: Bearer <TOKEN_DE_ADMINISTRADOR>" \
  -H "Content-Type: application/json" \
  -d '{ "titulo": "Título de la misión", "descripcion": "Descripción", "categoria": "historica" }'
```

## 9. Tiempo real (Socket.io)

Las actividades grupales (RF-019) funcionan con salas: el docente crea una sala para uno de sus grupos y una actividad; los estudiantes de ese grupo entran con el identificador o el código de la sala, el docente inicia la actividad de forma sincronizada, todos intercambian eventos y el docente la finaliza para otorgar los puntos. Las salas viven en memoria del proceso; en la base de datos solo se registran la sala (`salas`) y la participación de cada estudiante (`participaciones_grupales`).

### Conexión y autenticación

El cliente se conecta al mismo host y puerto de la API y envía el JWT en el handshake (con o sin el prefijo `Bearer `):

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", { auth: { token: "<TOKEN>" } });

socket.on("connect_error", (error) => {
	console.log(error.message, error.data?.codigo);
});
```

- Se valida el mismo JWT y la misma comprobación contra la base de datos que en REST (firma, vigencia, usuario existente y mismo rol). La identidad nunca se toma de los eventos del cliente.
- Solo pueden conectarse los roles `estudiante` y `docente`. El administrador no usa salas.
- Errores de handshake (`connect_error`, con `error.data.codigo`): `no_autorizado`, `token_invalido`, `rol_no_permitido`, `demasiadas_conexiones` y `error_interno`.
- El origen se valida contra `CORS_ORIGINS` en cada conexión (incluida la subida a WebSocket) y, con `FORCE_HTTPS=true`, se exige WSS.

### Formato de respuesta (ack)

Todo evento cliente a servidor responde mediante la función de confirmación (ack):

```json
{ "ok": true, "...datos": "..." }
```

```json
{
	"ok": false,
	"error": { "codigo": "sala_llena", "mensaje": "La sala está llena.", "status": 409, "datos": {} }
}
```

`datos` aparece solo cuando el error aporta contexto. Si el cliente no pasa un ack, el error llega como evento `sala:error` con `{ evento, error }`.

### Eventos del cliente al servidor

| Evento                    | Rol                                      | Payload                                         | Respuesta (`ok: true`)                                         |
| ------------------------- | ---------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `sala:crear`              | `docente`                                | `{ grupo_id, actividad_id, capacidad_minima? }` | `{ sala }` (snapshot, incluye el código de la sala)            |
| `sala:unirse`             | `docente` dueño o `estudiante` del grupo | `{ sala_id }` o `{ codigo }`                    | `{ ya_estaba, sala }` (sirve también para reconectarse)        |
| `sala:salir`              | `estudiante`                             | `{ sala_id? }`                                  | `{ sala_id, salio }`                                           |
| `sala:estado`             | Dueño o participante                     | `{ sala_id? }`                                  | `{ sala }` (snapshot actual o resumen guardado si terminó)     |
| `sala:listar_disponibles` | Ambos                                    | sin payload                                     | `{ salas }` (salas abiertas visibles para el usuario)          |
| `sala:cerrar`             | `docente` dueño                          | `{ sala_id? }`                                  | `{ estado, ya_cerrada }` (cancela: nadie recibe puntos)        |
| `actividad:instrucciones` | `docente` dueño                          | `{ instrucciones }` (texto o `null`)            | `{ instrucciones }` (solo antes de iniciar)                    |
| `actividad:iniciar`       | `docente` dueño                          | `{ sala_id? }`                                  | `{ iniciada_en, servidor_ahora }`                              |
| `actividad:evento`        | Participante                             | `{ tipo, datos? }`                              | `{ secuencia }`                                                |
| `actividad:resultado`     | `estudiante`                             | `{ resultado }` (objeto)                        | `{}`                                                           |
| `actividad:finalizar`     | `docente` dueño                          | `{ sala_id? }`                                  | `{ finalizada_en, resultados }` (idempotente: `ya_finalizada`) |

Reglas de validación: `tipo` solo admite minúsculas, números y guion bajo (hasta 40 caracteres); `datos` y `resultado` deben ser objetos de hasta 2048 bytes; las instrucciones admiten hasta 2000 caracteres; `capacidad_minima` va de 1 a 40. Cuando el payload omite `sala_id`, se usa la sala asociada al socket.

### Eventos del servidor al cliente

| Evento                             | Destinatarios               | Contenido principal                                                                                |
| ---------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `sala:participante_conectado`      | Sala                        | `usuario_id`, `participante` y la lista actualizada de `participantes`.                            |
| `sala:participante_reconectado`    | Sala                        | Igual que el anterior, cuando vuelve alguien en período de gracia.                                 |
| `sala:participante_desconectado`   | Sala                        | `usuario_id`, `rol`, `gracia_ms` y `participantes`.                                                |
| `sala:participante_expirado`       | Sala                        | `usuario_id`: no volvió a tiempo y se lo da por salido.                                            |
| `sala:participante_salio`          | Sala                        | `usuario_id`: salió voluntariamente.                                                               |
| `sala:sesion_reemplazada`          | Socket anterior del usuario | `sala_id`: el mismo usuario entró desde otra conexión.                                             |
| `sala:cerrada`                     | Sala                        | `sala_id` y `motivo` (por ejemplo `docente`, `docente_ausente`, `tiempo_agotado`).                 |
| `sala:error`                       | Socket que emitió           | `{ evento, error }` cuando el evento no llevaba ack.                                               |
| `actividad:instrucciones`          | Sala                        | `sala_id`, `instrucciones`.                                                                        |
| `actividad:iniciada`               | Sala                        | `sala_id`, `iniciada_en`, `servidor_ahora`, `instrucciones` (permite sincronizar el reloj).        |
| `actividad:evento`                 | Sala                        | Evento numerado: `secuencia`, `tipo`, `datos`, `usuario_id`, `nombre_usuario`, `rol`, `timestamp`. |
| `actividad:resultado_participante` | Solo el docente             | `usuario_id`, `nombre_usuario`, `resultado` del estudiante.                                        |
| `actividad:recompensa`             | Cada estudiante premiado    | `puntos_obtenidos`, `progreso`, `retroalimentacion`, `positive_message`.                           |
| `actividad:finalizada`             | Sala                        | `finalizada_en` y `resultados` por participante.                                                   |

### Límites, reconexión y gracia

- **Gracia ante desconexiones**: un participante desconectado no sale de inmediato. Se espera 30 s al estudiante y 60 s al docente (`SALA_GRACIA_ESTUDIANTE_MS` y `SALA_GRACIA_DOCENTE_MS`). Si vuelve a tiempo y ejecuta `sala:unirse`, recupera su lugar y recibe el snapshot actual con los últimos eventos; si no, el estudiante se da por salido (con registro de abandono si la actividad estaba en curso) y, si era el docente, la sala se cierra.
- **Capacidad y vida de la sala**: hasta 40 estudiantes por sala; una sala abierta más de 4 horas se cierra sola (revisión cada 5 minutos). Al arrancar, las salas que figuran abiertas en la base de datos se cierran, porque pertenecen a una ejecución anterior.
- **Ritmo**: máximo 40 eventos por ventana de 10 s por socket (excedido: error `demasiadas_solicitudes`, 429); un socket que supera el triple de ese tope se desconecta. Hasta 5 conexiones simultáneas por usuario.
- **Tamaño**: `maxHttpBufferSize` de 20 KB por mensaje y 10 s de tiempo máximo para completar el handshake.
- **Sesión**: el socket se corta al vencer el JWT, y el usuario se revalida contra la base cada 30 s (un usuario borrado o con otro rol pierde el acceso).
- **Reinicio del servidor**: las salas abiertas se pierden, porque el estado está en memoria. Los clientes que se reconectan deben volver a unirse.

## 10. Seguridad

| Área                  | Implementación                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT                   | Algoritmo HS256 fijado al firmar y al verificar. Claims: `id`, `rol`, `iss`, `aud`, `iat` y `exp` (un token sin `exp` se rechaza). Vigencia por defecto de 1 día.                                                                                             |
| Sesión contra la base | Además de la firma, cada petición autenticada consulta al usuario: si fue eliminado o su rol cambió desde que se emitió el token, responde 401. Un fallo de la base de datos responde 500, no 401.                                                            |
| Roles                 | `requireRole(...)` restringe cada ruta a `estudiante`, `docente` o `administrador` y falla cerrado (sin roles indicados, nadie pasa). El registro público solo admite `estudiante` y `docente`; el administrador se crea con el seeder.                       |
| Contraseñas           | `bcrypt` con `BCRYPT_ROUNDS` (12 por defecto); el login compara siempre contra un hash (real o de referencia) para no revelar por tiempo si la cuenta existe, y devuelve un mensaje genérico.                                                                 |
| Restablecimiento      | Token aleatorio de 32 bytes, guardado solo como hash SHA-256, de un solo uso (se consume de forma atómica), con vigencia de `RESET_TOKEN_EXPIRES_MIN` minutos; solo vale el último enlace solicitado. `forgot-password` responde igual exista o no el correo. |
| CORS                  | Lista exacta de orígenes (`CORS_ORIGINS`), compartida por HTTP y Socket.io. Un navegador con otro `Origin` recibe 403. Las peticiones sin `Origin` (curl, servidor a servidor) no se bloquean por CORS: decide la autenticación.                              |
| Cabeceras             | `helmet` con una política de contenido restrictiva (`default-src 'none'`), `Referrer-Policy: no-referrer`, HSTS solo en producción y `Cache-Control: no-store` en `/api`. `x-powered-by` desactivado.                                                         |
| Límite de intentos    | Login (por IP y por cuenta), registro, recuperación y restablecimiento de contraseña. Almacén en memoria: válido para una sola instancia del servidor; con varias réplicas haría falta un almacén compartido.                                                 |
| Cuerpos               | `JSON_BODY_LIMIT` (100 kb por defecto) y mensajes de error fijos, sin eco del contenido.                                                                                                                                                                      |
| Registro de docentes  | Requiere `DOCENTE_REGISTRATION_CODE`; sin código configurado en el servidor, nadie puede registrarse como docente.                                                                                                                                            |
| Logs                  | `utils/logger.js` redacta JWT, hashes bcrypt, cabeceras `Bearer` y campos sensibles antes de escribir un error; en producción no incluye trazas.                                                                                                              |
| Auditoría de rutas    | `npm run routes:audit` falla si una ruta sensible queda sin autenticación o sin el rol que corresponde a su prefijo. Se ejecuta en la integración continua.                                                                                                   |

### Qué configurar para producción

1. `NODE_ENV=production`.
2. Un `JWT_SECRET` aleatorio y largo (el servidor no arranca con uno débil).
3. `CORS_ORIGINS` con los orígenes HTTPS del frontend.
4. `TRUST_PROXY` con el número de proxies delante del servicio, para que los límites de intentos vean la IP real.
5. `FORCE_HTTPS=true` si el proxy termina TLS (junto con `TRUST_PROXY`).
6. `FRONTEND_URL` con la URL pública del frontend, y la configuración `SMTP_*` completa si se usa la recuperación de contraseña.
7. No ejecutar `db:seed:demo` sobre datos reales.

## 11. Calidad

**Formato y análisis estático.** ESLint (configuración plana en `eslint.config.js`, con `eslint-config-prettier`) y Prettier (configuración compartida en `.prettierrc.json` en la raíz del repositorio: tabuladores, comillas dobles, punto y coma, comas finales y ancho de 110 columnas).

```bash
npm run lint
```

```bash
npm run format:check
```

**Integración continua.** El workflow `.github/workflows/ci.yml` se ejecuta en cada pull request y en cada push a `main` (Node 24). El job `backend` ejecuta, con valores ficticios de `DB_*` y `JWT_SECRET` que no requieren una base de datos:

1. `npm ci`.
2. `npx prisma validate --config prisma7.config.ts`.
3. `npx prisma generate --config prisma7.config.ts`.
4. Chequeo de sintaxis con `node --check` sobre todos los `.js` de `src` y `database`.
5. `npx eslint .`.
6. Prueba de arranque: importa `src/app.js` sin abrir el servidor ni conectar a la base de datos.
7. `npm run routes:audit`.

Un segundo job (`frontend`) valida el cliente; se describe en el README del frontend.

**Pruebas.** El backend no tiene todavía una suite de pruebas automatizadas (no hay archivos de pruebas ni un script `test`). La verificación funcional ha sido manual y mediante pruebas de humo puntuales que no forman parte del repositorio; la integración continua cubre únicamente lo listado arriba. Las pruebas automatizadas de extremo a extremo figuran como trabajo pendiente en [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md).

## 12. Solución de problemas

| Síntoma                                                                                                 | Causa y solución                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El navegador recibe 403 o un error de CORS                                                              | El frontend corre en un origen que no está en `CORS_ORIGINS`. Por defecto solo se aceptan `http://localhost:5173` y `http://127.0.0.1:5173`; si Vite abre otro puerto (por ejemplo 5174), libere el 5173 o agregue el origen a `CORS_ORIGINS`. |
| `Cannot find module '.../generated/prisma/client.ts'` al arrancar, al correr `routes:audit` o el seeder | Falta generar el cliente de Prisma: ejecute `npx prisma generate --config prisma7.config.ts`.                                                                                                                                                  |
| `Faltan variables de entorno requeridas: ...`                                                           | Falta alguna de `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` o `DB_NAME` en `backend/.env`.                                                                                                                                    |
| `ECONNREFUSED` o `Access denied` al migrar, sembrar o arrancar                                          | MySQL no está en ejecución, o `DB_*` es incorrecto; compruebe también que la base `DB_NAME` exista (las migraciones no la crean).                                                                                                              |
| Aviso `[seguridad] ... JWT_SECRET es débil`                                                             | En desarrollo es solo un aviso; en producción el servidor no arrancaría. Genere un secreto con el comando de la [sección 3](#3-puesta-en-marcha).                                                                                              |
| Respuestas 429 "Demasiados intentos" durante una demostración                                           | Se alcanzó un límite de autenticación (por ejemplo, 8 fallos seguidos para una misma cuenta e IP). Reinicie el servidor, espere la ventana o inicie con `RATE_LIMIT_DISABLED=true` en `.env`.                                                  |
| Registrar un docente responde 403                                                                       | Falta `DOCENTE_REGISTRATION_CODE` en el servidor ("registro de docentes no habilitado") o el `codigoDocente` enviado no coincide.                                                                                                              |
| No llega el correo de recuperación                                                                      | Solo se envía con `NODE_ENV=production` y `SMTP_*` completo. En desarrollo el enlace se imprime en la consola del backend.                                                                                                                     |
| "Sesión inválida" o vuelve al inicio de sesión tras un cambio de configuración                          | Cambiar `JWT_SECRET`, `JWT_ISSUER` o `JWT_AUDIENCE` invalida los tokens existentes: cierre sesión y vuelva a ingresar.                                                                                                                         |
| `EADDRINUSE` al arrancar                                                                                | El puerto (`PORT`, 3000 por defecto) está ocupado por otro proceso.                                                                                                                                                                            |
| Las salas en vivo desaparecen tras reiniciar                                                            | Es el comportamiento esperado: las salas viven en memoria y las abiertas se cierran al arrancar.                                                                                                                                               |

## 13. Documentación relacionada

- [`docs/GUIA_DEMO.md`](../docs/GUIA_DEMO.md): arranque para demostraciones, cuentas de demostración, guion y limitaciones conocidas.
- [`docs/ERS.md`](../docs/ERS.md): especificación de requisitos del software (referencias RF y RNF citadas en el código).
- [`docs/SDD.md`](../docs/SDD.md): documento de diseño del software (arquitectura, modelo de datos, API y seguridad).
- [`docs/PlanDeTrabajo.md`](../docs/PlanDeTrabajo.md): plan de trabajo, sprints y responsables.
- [`frontend/README.md`](../frontend/README.md): cliente web.
