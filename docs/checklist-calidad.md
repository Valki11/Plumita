# Checklist de calidad

Se revisa al cerrar cada fase (las filas marcadas con su fase) y completo en F8. Cada casilla se marca solo con evidencia: un comando, un test o una prueba manual descrita.

## Mínimos obligatorios

- [ ] **Variables de entorno:** `.env.example` lista todas las variables (F1). `.env` no está en git. `env.ts` falla al arrancar si falta una.
- [ ] **Hashing:** contraseñas con argon2id. Ninguna contraseña en logs ni en la BD en texto plano (F2).
- [ ] **Validación en servidor:** cada Server Action y Route Handler valida con zod. No hay `any` ni `as` sobre datos del cliente (F2 en adelante).
- [ ] **Rate limiting en login:** 5 fallos en 15 min bloquean 15 min, con test de integración (F2).
- [ ] **HTTPS:** no aplica en localhost. La guía de VPS con TLS automático existe en `operacion.md` (F1). Con `COOKIE_SECURE=false` solo en local.
- [ ] **Backup de PostgreSQL:** `backup.sh` ejecutado y programado (F1, F8).
- [ ] **Restauración probada:** `restore-test.sh` devuelve `OK` con datos reales. Fecha y resultado: ______ (F1, F8).
- [ ] **CI:** lint, typecheck, tests y build en verde en `main` (F1 en adelante).
- [ ] **Mobile-first:** cada pantalla revisada a 360 px y en el celular de Linda, sin scroll horizontal.
- [ ] **WCAG AA básico:** ver sección de accesibilidad.

## Seguridad

- [ ] La cookie es `httpOnly`, `sameSite=lax`, de 30 días, y `secure` cuando `COOKIE_SECURE=true`.
- [ ] Toda consulta y escritura filtra por el `idUsuario` de la sesión (revisión de cada acción).
- [ ] Mensaje de login genérico, sin revelar si el usuario existe.
- [ ] `REGISTRO_ABIERTO=false` verificado en el entorno final (F8).
- [ ] El token del bot y los códigos de vinculación no aparecen en los logs.
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas o críticas sin evaluar.
- [ ] El puerto de la BD solo escucha en `127.0.0.1`.

## Accesibilidad (WCAG AA básico)

- [ ] Contraste de texto ≥ 4.5:1 (usar `--color-accent-700` y `--color-neutral-700` según el análisis R-5). Texto grande y componentes ≥ 3:1.
- [ ] Foco visible en todo elemento interactivo (`:focus-visible` de Organic), navegable con teclado y con orden lógico.
- [ ] Cada campo con `label` asociado. Los errores con `aria-describedby` y mensaje en texto, sin depender solo del color.
- [ ] Objetivos táctiles ≥ 44 × 44 px.
- [ ] Los diálogos atrapan el foco, se cierran con Escape y devuelven el foco al origen.
- [ ] Los íconos que son botones tienen `aria-label`. Los decorativos, `aria-hidden`.
- [ ] La navegación inferior marca la pestaña actual con `aria-current="page"`.
- [ ] El zoom al 200 % no rompe el diseño. `lang="es"` en `<html>`.
- [ ] Los toasts y avisos usan `role="status"` o `role="alert"`.

## Correctitud del dominio

- [ ] Tests unitarios de `edad.ts`: ingreso hoy, 6 y 7 días después, edad igual al límite y una semana más.
- [ ] Tests de `alimento.ts`: grupos por tipo y etapa, 0 horarios y 1 a 3 horarios.
- [ ] Tests de `proyeccion15`: sin compras (sin costo), sin aves, inventario mayor que la necesidad (resultado 0) y margen.
- [ ] Hoja de verificación a mano: 15 aves de ejemplo, consumo diario, cantidad por toma, días de alcance y lb a comprar, comparados con la app.
- [ ] Tests de `lib/tiempo.ts`: medianoche en Guatemala (UTC-6) y cambio de día.
- [ ] Redondeo solo en la presentación. Dinero con decimales exactos.

## Telegram y recordatorios

- [ ] Dos ticks seguidos o un reinicio dentro de la ventana no duplican el envío (test de integración).
- [ ] Un horario de hace más de 10 min no se envía.
- [ ] Una alimentación registrada en los 60 min previos deja el estado `omitido` y no envía nada.
- [ ] Fallo simulado de Telegram: estado `error`, reintento hasta 3 veces y la app sigue funcionando.
- [ ] El código de vinculación expira a los 10 min, es de un solo uso y uno nuevo reemplaza al anterior.
- [ ] La alerta de inventario llega una sola vez, y tras registrar una compra se rehabilita.
- [ ] Hay un solo consumidor de `getUpdates` (sin errores 409 en el log).

## Rendimiento y operación

- [ ] Las pantallas principales cargan en menos de 2 s por la LAN (RNF-02), medido en el celular.
- [ ] `docker compose up --build` desde cero levanta, migra y siembra sin pasos manuales.
- [ ] `app` y `db` tienen healthcheck y `restart: unless-stopped`.
- [ ] El equipo no se suspende durante las pruebas. IP reservada en el router y regla de firewall creada.
- [ ] `GET /api/health` responde 200 solo si la BD responde.

## Código y repositorio

- [ ] TypeScript estricto, sin errores de `tsc --noEmit`.
- [ ] Sin comentarios explicativos en el código.
- [ ] Commits en Conventional Commits.
- [ ] El dominio (`server/dominio`) no importa Prisma, Next ni Telegram.
- [ ] `README.md` con arranque en 5 comandos.

## Pruebas con usuaria (F7)

- [ ] Casos CP-01 a CP-23 ejecutados y con resultado registrado.
- [ ] Linda completa sin ayuda: registrar alimentación, registrar una compra, ver la proyección y agregar un ave.
- [ ] Linda recibe un recordatorio real en su Telegram.
- [ ] Valores de pato confirmados o ajustados.
- [ ] Observaciones priorizadas, y las bloqueantes cerradas.

## Registro de evidencias

| Fecha | Fase | Elemento | Resultado | Evidencia |
|---|---|---|---|---|
| | | | | |
