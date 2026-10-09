set -e
npx prisma migrate deploy
npx prisma db seed
if [ "$SEED_DEMO" = "true" ]; then npm run seed:demo; fi
exec npm start
