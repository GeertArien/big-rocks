# BigRocks — single-container image: build the frontend, then serve it as static
# files from the Fastify backend. SQLite DB lives on a mounted volume.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Build stage: install everything and build all workspaces ----------------
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# `pnpm build` runs: prisma generate + core (tsup) + server (tsup) + web (vite).
RUN pnpm build

# ---- Runtime stage -----------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_URL=file:/data/dev.db

# Bring over the built workspace (includes node_modules with the Prisma CLI +
# generated client, the server bundle, and the web dist).
COPY --from=build /app /app

# SQLite database directory (mount a volume here to persist across restarts).
RUN mkdir -p /data
VOLUME ["/data"]

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
