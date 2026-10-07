# ADR 0003: Vinculación de Telegram y recepción de updates

- Estado: aceptada
- Fecha: 2026-10-06

## Contexto

Un bot de Telegram no puede escribirle a una persona solo con su número de celular: la persona debe iniciar la conversación con el bot. El sistema necesita guardar el `chat_id` de Linda para enviarle recordatorios y alertas. El bot ya está creado. No hay URL pública, así que un webhook no es posible por ahora.

## Decisión

**Vinculación**

1. En Ajustes, la usuaria toca "Vincular Telegram". La acción `generarCodigoVinculacion` crea un código aleatorio (16 bytes, base64url), lo guarda en `usuario.codigo_vinculacion` con `codigo_vinculacion_expira = ahora + 10 min` y devuelve el enlace `https://t.me/<TELEGRAM_BOT_USERNAME>?start=<codigo>`.
2. Ella abre el enlace y toca "Iniciar". Telegram envía `/start <codigo>` al bot.
3. `manejarUpdate` busca el código, comprueba que no haya expirado, guarda `telegram_chat_id`, **borra el código** (un solo uso) y responde con un mensaje de bienvenida (CP-14).
4. Código inválido, usado o expirado: el bot responde que debe generar uno nuevo desde la app. Generar un código nuevo reemplaza al anterior.
5. Un `chat_id` pertenece a una sola cuenta.
6. La pantalla de Ajustes consulta el estado cada pocos segundos mientras el código está vigente, y muestra "Vinculado" cuando llega el `chat_id`.

**Recepción de `/start`: long polling detrás de una interfaz**

```ts
interface FuenteUpdatesTelegram {
  iniciar(manejar: (update: UpdateTelegram) => Promise<void>): void
  detener(): Promise<void>
}
```

- Implementación actual: `LongPollingTelegram`, con `getUpdates` (`timeout=30`, `allowed_updates=["message"]`) dentro del proceso de `app`.
- Al arrancar llama a `deleteWebhook`, porque `getUpdates` no funciona si hay un webhook registrado.
- Un solo consumidor por token: singleton en `globalThis`. Dos instancias con el mismo token provocan errores 409.
- El `offset` se guarda en memoria. Si el proceso se reinicia, Telegram puede reenviar updates no confirmados. `manejarUpdate` es idempotente porque el código es de un solo uso.
- Errores de red: reintento con retroceso exponencial hasta 60 s.

## Preparado, no implementado: webhook

`TELEGRAM_WEBHOOK_SECRET` queda reservado en `.env.example`. Cuando exista un VPS con HTTPS:

1. Añadir `POST /api/telegram/webhook` que valide el encabezado `X-Telegram-Bot-Api-Secret-Token` contra `TELEGRAM_WEBHOOK_SECRET` y llame al mismo `manejarUpdate`.
2. Registrarlo con `setWebhook(url, secret_token)`.
3. Apagar `LongPollingTelegram` y quitar el `deleteWebhook`.

No hay que tocar el dominio ni la vinculación: solo se cambia la implementación de la interfaz.

## Alternativas descartadas

- **Pedir que la usuaria escriba su `chat_id`:** inusable.
- **Enlace sin código:** no se podría saber a qué cuenta pertenece el chat.
- **Código sin expiración o reutilizable:** un enlace filtrado vincularía otra cuenta.
- **Túnel (ngrok, Cloudflare) para el webhook:** dependencia externa y URL cambiante para un proyecto local.

## Consecuencias

- La vinculación y los envíos funcionan sin exponer nada a internet.
- Si `app` está caída, el `/start` espera hasta 24 h en Telegram y se procesa al volver, siempre que el código no haya expirado.
- Los recordatorios y alertas solo se envían a cuentas vinculadas. Sin vínculo no hay recordatorios, pero la app funciona igual.
