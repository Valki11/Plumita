# Plumita

Aplicación web mobile-first para el control de alimentación en producción avícola de traspatio. Documentación en [docs/](docs/).

## Arranque con un solo comando

Requisitos: Docker Desktop en ejecución.

```bash
cp .env.example .env
```

Completar en `.env` `POSTGRES_PASSWORD` y `SESSION_SECRET` (al menos 32 caracteres), y poner la misma contraseña dentro de `DATABASE_URL`. Después:

```bash
docker compose up --build
```

La app queda en http://localhost:3000. Con `SEED_DEMO=true` en `.env` carga datos de demostración: usuario `rosa`, contraseña `plumita123`.

Para verla como celular: abrir las herramientas del navegador (F12) y activar la vista de dispositivo móvil. Para abrirla desde un celular real, ver [docs/operacion.md](docs/operacion.md).

## Desarrollo

```bash
docker compose up -d db
npm install
npx prisma migrate dev
npm run seed
npm run seed:demo
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run build` | Build de producción |
| `npm run seed` | Carga el catálogo de tipos de ave y la tabla alimenticia |
| `npm run seed:demo` | Recrea la usuaria de demostración con aves, horarios, compras y alimentaciones |
| `npm run seed:caso` | Recrea la usuaria `demo` con el caso verificable de la demostración (ver [docs/demo.md](docs/demo.md)) |
