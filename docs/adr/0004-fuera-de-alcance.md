# ADR 0004: Fuera de alcance ("preparado, no implementado")

- Estado: aceptada
- Fecha: 2026-10-06

## Contexto

El proyecto tiene una usuaria, un plazo corto (31 de octubre de 2026) y se ejecuta en localhost. Se listan aquí capacidades habituales en un sistema productivo, para dejar claro qué no se construye y qué deja preparado el diseño.

## Decisión

| Capacidad | Estado | Qué queda preparado |
|---|---|---|
| **Despliegue en VPS con reverse proxy y TLS** | Documentado, no ejecutado | Guía en `operacion.md` §4 (Caddy y Compose). `COOKIE_SECURE`, `APP_URL` y la imagen standalone ya lo soportan. |
| **Kubernetes** | Fuera de alcance | La app es una imagen sin estado local. Con un solo proceso de fondo no se puede escalar horizontalmente sin extraer el planificador. |
| **OpenTelemetry** | Fuera de alcance | Logs JSON con un campo `evento`, que son fáciles de convertir en trazas o métricas después. |
| **MFA y passkeys** | Fuera de alcance | El acceso está aislado en `server/auth/`. Añadir un segundo factor sería un paso más tras la verificación de argon2. |
| **Feature flags** | Fuera de alcance | Solo hay variables de entorno (`REGISTRO_ABIERTO`). |
| **SBOM** | Fuera de alcance | `package-lock.json` versionado e imagen base fijada. `npm audit` opcional en CI. |
| **i18n** | Fuera de alcance | La UI está solo en español de Guatemala. Los textos están centralizados en los componentes, sin diccionarios. |
| **Recuperación de contraseña** | Fuera de alcance (DAD 2.4) | Si Linda la olvida, la desarrolladora la restablece con un script local. |
| **Webhook de Telegram** | Preparado, no implementado | ADR 0003. |
| **Edición del margen de proyección y de la tabla alimenticia** | Fuera de alcance (DAD) | El margen es una columna y la tabla es un seed. |

## Consecuencias

- No se dedica tiempo a estas capacidades antes del 31/10.
- Ninguna se bloquea por decisiones tomadas: cada una se puede añadir sin reescribir el dominio.
- El script de restablecimiento de contraseña (`scripts/restablecer-contrasena.ts`) es una herramienta de operación local, no una funcionalidad de la app.
- Las limitaciones que provoca no tener servidor (análisis R-1 y R-2) quedan asumidas.
