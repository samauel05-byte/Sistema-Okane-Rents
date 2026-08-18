#!/bin/sh
set -e

# Apply any pending database migrations automatically on production
# deploys, so nobody has to run `prisma migrate deploy` by hand.
if [ "$VERCEL_ENV" = "production" ]; then
  npx prisma migrate deploy
fi

next build
