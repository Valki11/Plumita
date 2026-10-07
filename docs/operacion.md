# Operación de Plumita

## 1. Arranque local

```bash
cp .env.example .env
docker compose up --build -d
docker compose logs -f app
```

Rellenar en `.env`: `POSTGRES_PASSWORD`, `DATABASE_URL` (con esa misma contraseña), `SESSION_SECRET` (`openssl rand -base64 48`), `TELEGRAM_BOT_TOKEN` y `TELEGRAM_BOT_USERNAME`. Con `docker compose` el host de la base es `db`. Con `npm run dev` en el host es `localhost`.

## 2. Abrir la app desde el celular de la usuaria (pruebas)

Requisitos: el equipo con Plumita y el celular en la **misma red Wi-Fi**.

1. En el equipo, obtener la IP de la red local: `ipconfig` (Windows), línea "Dirección IPv4" del adaptador Wi-Fi, por ejemplo `192.168.1.25`.
2. Permitir el puerto en el firewall de Windows (PowerShell como administrador):
   ```powershell
   New-NetFirewallRule -DisplayName "Plumita 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
   ```
   La red Wi-Fi debe estar marcada como "Privada".
3. En el celular, abrir `http://192.168.1.25:3000`. Agregar a la pantalla de inicio para que se comporte como app.
4. Fijar la IP para que no cambie: reserva DHCP en el router para la MAC del equipo, o IP estática.
5. En `.env` dejar `COOKIE_SECURE=false`, porque sin HTTPS una cookie `secure` no se guarda.
6. Evitar que el equipo se suspenda mientras haya pruebas: Configuración → Energía → "Nunca" en suspensión con corriente. Si se suspende, se pierden los recordatorios y Linda no entra.

Si no carga: confirmar que `docker compose ps` muestra `app` como `healthy`, que no hay VPN activa y que el router no tiene "aislamiento de clientes".

Telegram no necesita nada de esto: el bot solo hace conexiones salientes.

## 3. Backup y restauración de PostgreSQL

Scripts en `docker/backup/` (se escriben en F1):

- `backup.sh`: `docker compose exec -T db pg_dump -U $POSTGRES_USER -Fc $POSTGRES_DB > backups/plumita-AAAAMMDD-HHMM.dump`. Conserva los últimos 14 y borra los más viejos. La carpeta `backups/` está fuera de git.
- `restore-test.sh`: crea la base temporal `plumita_restore_test`, restaura el último dump con `pg_restore`, compara los conteos de `usuario`, `ave`, `compra_alimento` y `registro_alimentacion` contra la base real, imprime `OK` o `FALLO` y borra la base temporal.

Programación: tarea programada de Windows (diaria, 22:00) que ejecuta `backup.sh` con Git Bash. Copiar la carpeta `backups/` a otro disco o nube cada semana, porque el equipo es un punto único de fallo.

Restauración real (pérdida de datos):

```bash
docker compose stop app
docker compose exec -T db dropdb -U $POSTGRES_USER $POSTGRES_DB
docker compose exec -T db createdb -U $POSTGRES_USER $POSTGRES_DB
docker compose exec -T db pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --no-owner < backups/<archivo>.dump
docker compose start app
```

"Restauración probada" significa haber ejecutado `restore-test.sh` con éxito y haber guardado el resultado en `docs/checklist-calidad.md`. Se hace en F1 con la base vacía y de nuevo en F8 con datos reales.

## 4. Guía de VPS con Compose y TLS (documentada, no ejecutada)

Ver [ADR 0004](adr/0004-fuera-de-alcance.md). Pasos previstos para cuando exista un servidor:

1. VPS con Ubuntu LTS, usuario sin root, firewall con solo 22, 80 y 443, Docker y el plugin de Compose.
2. Dominio con un registro A hacia la IP del VPS.
3. Añadir un servicio `caddy` al Compose con `Caddyfile`:
   ```
   plumita.midominio.com {
       reverse_proxy app:3000
   }
   ```
   Caddy obtiene y renueva el certificado de Let's Encrypt automáticamente.
4. Quitar la publicación del puerto 3000 de `app`. Solo Caddy expone 80 y 443.
5. En `.env`: `APP_URL=https://plumita.midominio.com`, `COOKIE_SECURE=true` y `REGISTRO_ABIERTO=false` tras crear la cuenta de Linda.
6. Copiar el repositorio, `docker compose up -d --build`, y programar `backup.sh` con cron más copia externa.
7. Opcional: cambiar a webhook de Telegram (ADR 0003).

## 5. Comandos útiles

| Acción | Comando |
|---|---|
| Ver logs | `docker compose logs -f app` |
| Reiniciar la app | `docker compose restart app` |
| Consola SQL | `docker compose exec db psql -U $POSTGRES_USER $POSTGRES_DB` |
| Nueva migración (dev) | `npx prisma migrate dev --name <cambio>` |
| Cerrar el registro | `REGISTRO_ABIERTO=false` en `.env` y `docker compose up -d app` |
