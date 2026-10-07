# ADR 0001: Stack tecnológico

- Estado: aceptada
- Fecha: 2026-10-06

## Contexto

Plumita es una app para una sola granja y una usuaria real, usada desde un celular. La desarrolladora trabaja sola y tiene hasta el 31 de octubre de 2026. No hay VPS ni dominio: todo corre en localhost.

## Decisión

- **Monolito Next.js** (App Router, TypeScript estricto). UI con Server Components y mutaciones con Server Actions. Una sola ruta HTTP: `/api/health`.
- **PostgreSQL 16 con Prisma** como ORM y para las migraciones.
- **Docker Compose** con dos servicios: `app` y `db`.
- **Validación** con zod. **Hashing** con argon2id (`@node-rs/argon2`). **Sesión** con cookie firmada (`jose`).
- **Pruebas** con Vitest (unitarias y de integración contra PostgreSQL). **Lint** con ESLint (config de Next y `jsx-a11y`). **CI** con GitHub Actions.
- **Estilos** con el design system Organic (CSS y variables), sin Tailwind ni librería de componentes.
- **Planificador y long polling** dentro del proceso de `app`, arrancados desde `instrumentation.ts`.
- **Zona horaria** `America/Guatemala` en `TZ` y en un único módulo `lib/tiempo.ts`.

## Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| Backend y frontend separados (API + SPA) | Doble despliegue y doble tipado para una usuaria. |
| SQLite | El DAD y la decisión fijan PostgreSQL. Además se necesita unicidad e inserción atómica concurrente. |
| Cola de trabajos (BullMQ, Redis) o contenedor `worker` | Un tick de 60 s con tabla de idempotencia basta para el volumen. Un contenedor más complica el proyecto. |
| Cron del sistema operativo llamando a un endpoint | Exigiría un endpoint expuesto con secreto y una tarea externa. |
| NextAuth o Lucia | Hay un solo método de acceso. Cookie firmada propia es menos código y menos dependencias. |
| Tailwind o shadcn | Organic ya trae tokens y clases, y mezclar dos sistemas rompe el diseño. |

## Consecuencias

- Un solo proceso que sirve la UI y ejecuta tareas de fondo. No se puede escalar a varias réplicas sin revisar el planificador. La unicidad en BD protege de duplicados, pero el long polling debe tener un único consumidor.
- Si la app está caída, no hay recordatorios. Es un riesgo aceptado (análisis R-1).
- Se evita Redis, colas y proveedores externos. Queda todo en el stack mínimo.
- Kubernetes y observabilidad avanzada quedan fuera (ADR 0004).
