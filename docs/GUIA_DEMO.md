# Guía de demostración de MindGame

Guía para presentar el avance del proyecto en vivo, con datos realistas cargados por un seeder. Todo lo que se muestra
corresponde a funcionalidades implementadas en `main`.

## 1. Requisitos

- Node 24, MySQL en marcha y las dependencias instaladas (`npm ci` en `backend/` y en `frontend/`).
- `backend/.env` con: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` y, para tener el
  administrador, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Opcionales: `DOCENTE_REGISTRATION_CODE` (solo si se quiere mostrar el
  registro de un docente nuevo; sin él, ese registro responde 403), `CORS_ORIGINS` y `RATE_LIMIT_DISABLED=true`.
- `frontend/.env` no es necesario: el frontend usa `http://localhost:3000/api` por defecto.
- El navegador debe abrir el frontend en `http://localhost:5173` (el CORS por defecto solo permite ese origen).

## 2. Cómo arrancar

```bash
# En backend/
npm run db:migrate        # aplica las 25 migraciones
npm run db:seed           # administrador y niveles (idempotente)
npm run db:seed:demo      # datos de demostración (idempotente, tarda unos segundos)
npm run dev               # API y Socket.io en http://localhost:3000

# En frontend/ (otra terminal)
npm run dev               # http://localhost:5173
```

El seeder imprime al final las tablas de grupos y estudiantes y una verificación de consistencia. Si se corre de nuevo
responde "Nada nuevo". Se niega a correr con `NODE_ENV=production` (salvo `--force-produccion`).

## 3. Cuentas de demostración

Todas usan una sola contraseña: `MindGame#Demo2026` (constante `DEMO_PASSWORD_POR_DEFECTO` de
`backend/database/seeders/003_demo_seed.js`; se cambia con la variable de entorno `DEMO_PASSWORD` al correr el seeder).
Son cuentas de práctica: no uses esta contraseña en ninguna cuenta real. El inicio de sesión es con el **correo**:
`<usuario>@demo.mindgame.local`.

| Rol           | Usuario                                     | Qué mostrar con esta cuenta                                                             |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| Estudiante    | `estudiante.nicolas`                        | Cuenta nueva (0 puntos, sin grupo): recorrido desde cero y "unirse con código"          |
| Estudiante    | `estudiante.laura`                          | Nivel 1 con 45 puntos y varios fallos; con las 2 salas en vivo (30 + 30) sube a nivel 2 |
| Estudiante    | `estudiante.daniel`                         | Nivel 2 (130 puntos), misión histórica a medias                                         |
| Estudiante    | `estudiante.camila` / `estudiante.santiago` | Nivel 3, mezcla de misiones históricas y de convivencia                                 |
| Estudiante    | `estudiante.valentina` / `estudiante.mateo` | Nivel 4, misiones completadas y una en progreso                                         |
| Estudiante    | `estudiante.sofia`                          | Nivel máximo (1050 puntos): 5 misiones, todas las recompensas y logros                  |
| Docente       | `docente.ana`                               | Grupos "Ciencias Sociales 7°A" (5 estudiantes) y "Club de Historia" (vacío)             |
| Docente       | `docente.carlos`                            | Grupo "Taller de Convivencia 7°-8°" (5 estudiantes)                                     |
| Administrador | el de `ADMIN_EMAIL` (`npm run db:seed`)     | Dashboard y gestión de contenido. No forma parte de la demo: se usa tu propia cuenta    |

Códigos de grupo fijos: `SABER7` (Ana), `PAZ8B2` (Carlos) y `UNETE2` (Club de Historia, sin estudiantes, reservado para
mostrar en vivo "Unirme con código" con `estudiante.nicolas`). También quedan impresos al final del seeder.

Contenido cargado: 5 misiones nuevas (Los Muiscas, El Movimiento Comunero, la Constitución de 1991, Acuerdos para
convivir y Alto al matoneo) junto a las 2 misiones base del proyecto; 5 recompensas, 5 logros y 6 mensajes positivos
(solo se muestran en misiones de convivencia). Actividad para sala en vivo: **"Debate en equipo: el semáforo de la
convivencia"** (30 puntos) y, como segunda opción, "Línea del tiempo colaborativa de Colombia".

## 4. Guion sugerido (15 minutos)

Un navegador mantiene una sola sesión por perfil: para dos usuarios a la vez usá un segundo navegador, un perfil
distinto o una ventana privada.

**Estudiante (6 min)** con `estudiante.nicolas`:

1. Iniciar sesión → Misiones: estados Disponible / En progreso / Completada.
2. Abrir "Alto al matoneo": leer la historia ("Marcar como leída").
3. Retos: responder mal (aparece la explicación) y luego bien → puntos, "Nuevo logro: Primer paso" y mensaje positivo.
4. Responder el verdadero o falso: al llegar a 50 puntos aparece "Nueva recompensa: Insignia de Explorador".
5. Actividades: completar una (suma sus puntos y muestra la retroalimentación).
6. Mi progreso, Logros y Recompensas. Mostrar `estudiante.sofia` como contraste (nivel máximo, todo desbloqueado).
7. Mis grupos: unirse con `UNETE2`.

**Docente (5 min)** con `docente.ana`: Mis grupos (códigos y copiar) → "Ciencias Sociales 7°A" → estadísticas del grupo
(promedios, % de acierto) → estadísticas de un estudiante (`estudiante.sofia`). Luego la actividad en vivo:

1. Docente: grupo → "Iniciar actividad en vivo" → "Debate en equipo: el semáforo de la convivencia" → crear sala.
2. En un segundo navegador, `estudiante.laura` → Actividades en vivo → entrar a la sala (aparece sola o con el código).
3. El docente inicia, se envían eventos sincronizados y al finalizar los estudiantes reciben los 30 puntos.
   Los puntos de una actividad se otorgan una sola vez por estudiante; por eso las 2 actividades en vivo no están completadas
   por nadie.

**Administrador (3 min)**: Dashboard (conteos) → Misiones, Retos, Actividades, Contenidos, Recompensas, Logros, Mensajes
positivos (crear o editar uno) → intentar eliminar una recompensa ya obtenida: responde 409 y sugiere desactivarla.

**Seguridad (1 min)**: JWT con emisor y audiencia, sesión validada contra la base en cada petición, roles por ruta
(auditoría automática `npm run routes:audit`), límite de intentos de inicio de sesión, CORS por lista de orígenes, helmet,
contraseñas con bcrypt, enlaces de restablecimiento de un solo uso y errores siempre en JSON.

## 5. Restablecer o recargar los datos

```bash
npm run db:seed:demo:reset   # borra SOLO lo que creó el seeder (correos @demo.mindgame.local y su contenido por título)
npm run db:seed:demo         # lo vuelve a cargar desde cero
```

Úsalo después de ensayar (por ejemplo, `estudiante.nicolas` deja de estar en 0 puntos). No toca al administrador ni las
2 misiones base. Las cuentas que no son de demostración conservan sus puntos aunque hayan jugado contenido de demo (el
reset avisa si pasó). Los ids autoincrementales siguen creciendo; es normal.

## 6. Limitaciones conocidas (decirlas con honestidad)

- Sprint 5 pendiente: aviso de privacidad y política de tratamiento de datos de menores (hoy solo existe la casilla de
  aceptación en el registro), pruebas end-to-end automatizadas (la CI valida esquema, sintaxis, lint, arranque y
  protección de rutas), despliegue con HTTPS/WSS (el código ya lo soporta con `FORCE_HTTPS` y `TRUST_PROXY`, pero no está
  desplegado) y auditoría de responsive y accesibilidad.
- La pantalla de inicio del estudiante (`/estudiante`) es un marcador de posición; en el menú, "Retos" y "Convivencia" están
  deshabilitados. Conviene navegar por Misiones, Mi progreso, Logros, Recompensas, Mis grupos y Actividades en vivo.
- "Misiones" lista juntas las de historia y las de convivencia aunque el subtítulo habla solo de históricas.
- Las salas en vivo y los límites de intentos viven en la memoria del servidor: reiniciarlo las borra.
- El correo de recuperación de contraseña solo se envía con SMTP configurado; en desarrollo el enlace se imprime en la
  consola del backend.
- Las actividades recreativas se marcan como completadas con un botón; no tienen una interacción propia.

## 7. Problemas frecuentes

| Síntoma                                                                         | Causa y solución                                                                                                                                           |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EADDRINUSE` en 3000 o Vite abre 5174                                           | Hay otro proceso usando el puerto. Cerralo, o usá `--strictPort`.                                                                                          |
| 403 / error de CORS desde el navegador                                          | El frontend corre en un puerto que no está en `CORS_ORIGINS` (por defecto solo 5173). Liberá el 5173 o agregá el origen.                                   |
| "Sesión inválida" o vuelve al login                                             | El hardening de seguridad cambió el JWT: cerrá sesión (o borrá los datos del sitio) y volvé a entrar.                                                      |
| "Correo o contraseña incorrectos" con una cuenta demo                           | Se usa el correo completo `<usuario>@demo.mindgame.local`. Tras 8 fallos seguidos la cuenta se frena un rato; con `RATE_LIMIT_DISABLED=true` se desactiva. |
| `ECONNREFUSED` al iniciar el backend o el seeder                                | MySQL no está corriendo o las variables `DB_*` son incorrectas.                                                                                            |
| El seeder dice que un usuario o código "ya lo usa" una cuenta que no es de demo | Colisión con datos propios: cambiá esa cuenta o el código en el seeder.                                                                                    |
| Aviso "JWT_SECRET es débil"                                                     | Solo es un aviso en desarrollo; en producción el servidor no arrancaría.                                                                                   |
