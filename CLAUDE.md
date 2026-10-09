# Plumita

App web mobile-first para controlar la alimentación de una granja avícola de traspatio. Una usuaria real (Linda). Fecha límite: app funcionando en Docker Compose (localhost) el 31 de octubre de 2026.

## Fuentes de verdad

1. `docs/DAD.md` (v1.1) más `docs/DAD-v1.2-diff.md` (cambios aprobados).
2. `docs/analisis.md`, `docs/arquitectura.md`, `docs/adr/`, `docs/roadmap.md`, `docs/operacion.md`.
3. `docs/mockups/` y `docs/assets/`: solo guía visual. Si contradicen al DAD, manda el DAD (moneda Q, edad en semanas, horarios, 6 filas de tabla alimenticia).

Antes de implementar, leer la fase vigente en `docs/roadmap.md`. No empezar una fase sin aprobación. No reabrir decisiones de los ADR.

## Stack

Next.js (App Router, TypeScript estricto), PostgreSQL 16, Prisma, zod, `@node-rs/argon2`, `jose`, Vitest, ESLint. Docker Compose con `app` y `db`. Estilos con el design system Organic (`docs/mockups/_ds/organic-*/styles.css`), sin Tailwind.

## Comandos

Disponibles a medida que avanza la F1.

```bash
docker compose up -d db          # solo la base para desarrollo
npm run dev                      # app en el host, http://localhost:3000
npm run seed:demo                # usuaria rosa / plumita123 con datos de demostración
docker compose up --build -d     # stack completo
npm run lint
npm run typecheck                # tsc --noEmit
npm test                         # vitest run
npm run build
npx prisma migrate dev --name <cambio>
npx prisma db seed
bash docker/backup/backup.sh
bash docker/backup/restore-test.sh
```

Antes de dar una tarea por terminada: `npm run lint && npm run typecheck && npm test`.

## Convenciones

- **Idioma:** dominio, modelos, tablas, rutas, UI y mensajes en español (`Ave`, `registrarCompra`, `/alimentar`). Infraestructura y convenciones de Next en inglés (`layout`, `page`).
- **Archivos:** kebab-case. Componentes React en PascalCase dentro de archivos kebab-case. Un componente por archivo.
- **Estructura:** la de `docs/arquitectura.md` §3. `server/dominio` son funciones puras que no importan Prisma, Next ni Telegram. Los componentes no importan Prisma.
- **Mutaciones:** Server Actions en `server/acciones/`, que devuelven `Resultado<T>`. La única ruta HTTP es `/api/health`.
- **Validación:** esquemas zod en `lib/validacion/`, usados por el formulario y por la acción. Todo dato del cliente se valida en servidor.
- **Autorización:** cada acción llama `requerirUsuario()` y filtra por el `idUsuario` de la sesión.
- **Tiempo:** toda lógica de fechas pasa por `lib/tiempo.ts` (America/Guatemala). No usar `new Date()` ni `Date.now()` fuera de ese módulo, y las funciones de dominio reciben `ahora` o `hoy` por parámetro.
- **Dinero y cantidades:** `Decimal`, nunca `number` para dinero. Redondear solo al mostrar: 2 decimales en libras y en quetzales.
- **Edad:** en semanas, siempre calculada con `server/dominio/edad.ts`. No se guarda ni la edad ni la etapa.
- **Constantes:** en `lib/constantes.ts` (`MAX_HORARIOS = 3`, `DIAS_PROYECCION = 15`, `UMBRAL_DIAS_ALERTA = 3`, `VENTANA_RECORDATORIO_MIN = 10`, `OMITIR_SI_ALIMENTO_MIN = 60`).
- **UI:** usar los tokens y clases de Organic (`var(--color-*)`, `.btn`, `.card`...). No escribir hex, fuentes ni px que un token ya tenga. Íconos Lucide con trazo 2.75. Mobile-first, objetivos táctiles de 44 px, texto pequeño en acento con `--color-accent-700`.
- **Pruebas:** Vitest. Unitarias para `dominio`, `tiempo` y validación. De integración contra PostgreSQL real para acciones, rate limit y planificador.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`, `ci:`), en español, con alcance opcional (`feat(aves): ...`). Un cambio lógico por commit.
- **Ramas:** trabajo en `main` o en ramas cortas por fase (`f3-aves`).

## Reglas

- **Sin comentarios explicativos en el código.** El nombre y la estructura deben explicarlo. Los comentarios de documentación y TODOs tampoco.
- No sobre-ingenierizar: nada de colas, Redis, capas de abstracción ni librerías de componentes. Si algo no está en el DAD, el análisis o un ADR, preguntar antes de añadirlo.
- No se guardan secretos en git. Todo secreto va en `.env`, y cada variable nueva se añade a `.env.example` y a `env.ts`.
- No tocar `docs/DAD.md` sin que se pida. Los cambios van primero en el diff.
- Los recordatorios nunca se envían sin pasar por `notificacion_enviada` (idempotencia). No enviar mensajes de Telegram directamente desde acciones, salvo la alerta de inventario, que usa el flag `alerta_inventario_enviada`.
- Un solo consumidor de `getUpdates` por token. El long polling y el planificador arrancan solo desde `instrumentation.ts`.
- No registrar en logs contraseñas, el token del bot ni el código de vinculación.
- El inventario no se almacena: siempre es compras menos consumo registrado.
- Fuera de alcance (ADR 0004): Kubernetes, OpenTelemetry, MFA, feature flags, SBOM, i18n, recuperación de contraseña. No implementarlos ni preparar código para ellos.
- Al terminar una fase, actualizar `docs/checklist-calidad.md` con la evidencia.

## Variables de entorno

Ver `.env.example`. `REGISTRO_ABIERTO` es `true` en desarrollo y `false` en producción tras crear la cuenta de Linda. `COOKIE_SECURE=false` en local. `TELEGRAM_WEBHOOK_SECRET` está reservada y no se usa.
