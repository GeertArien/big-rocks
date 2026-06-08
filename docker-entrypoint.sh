#!/bin/sh
# Apply any pending migrations against the (persisted) SQLite database, then
# start the server. Safe to run on every boot — migrate deploy is idempotent.
set -e

echo "Applying database migrations..."
node_modules/.bin/prisma migrate deploy --schema packages/core/prisma/schema.prisma

echo "Starting BigRocks server..."
exec node apps/server/dist/index.js
