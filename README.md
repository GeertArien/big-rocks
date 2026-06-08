# BigRocks

A personal todo and productivity app organized around the principles popularized
in Stephen Covey's *The 7 Habits of Highly Effective People*. Put your big rocks
in first — let the smaller tasks fill in around them.

> Inspired by the prioritization and effectiveness principles popularized by
> Stephen Covey. This project is not affiliated with or endorsed by the
> Covey/FranklinCovey organizations.

## Architecture

A pnpm monorepo. All business logic lives in **`packages/core`** (the single
source of truth); the HTTP layer and the future MCP adapter are thin consumers.

```
apps/
  web/      Svelte 5 + Vite + TypeScript + Tailwind + shadcn-svelte (mobile-first, PWA-ready SPA)
  server/   Fastify HTTP layer — thin routes that call core; serves the built web app
packages/
  core/     Prisma schema + client, repositories, services, AI provider interface
```

- **Repositories** are the only code that touches Prisma. Services depend on
  repository interfaces, which keeps the SQLite→Postgres swap and the MCP
  adapter clean.
- The **quadrant** (importance × urgency) is always *derived*, never stored.
- The **REST API is the source of truth**, with an auto-generated OpenAPI spec at
  `/docs` and bearer-token auth.

## Prerequisites

- Node.js ≥ 20 (22 recommended)
- pnpm 10 (`corepack enable`)

## Local development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env        # then edit values; .env is gitignored

# 3. Set up the database (SQLite)
pnpm db:migrate             # apply migrations + generate the Prisma client
pnpm db:seed                # optional: a little starter data

# 4. Run
pnpm --filter @big-rocks/server dev   # API on http://localhost:3000
pnpm --filter @big-rocks/web dev      # UI on http://localhost:5173 (proxies /api)
```

API docs: <http://localhost:3000/docs>

### Workspace scripts

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm typecheck` | Type-check every workspace                    |
| `pnpm lint`      | ESLint across the repo                        |
| `pnpm test`      | Run all test suites (Vitest)                  |
| `pnpm build`     | Build core, server, and web                   |
| `pnpm db:migrate`| Create/apply Prisma migrations (dev)          |
| `pnpm db:seed`   | Seed the database                             |

## Docker

A multi-stage build compiles the frontend and serves it as static files from the
Fastify backend — one container. The SQLite file is persisted on a named volume.

```bash
# Build and run the stack
API_AUTH_TOKEN=$(openssl rand -hex 32) docker compose up --build

# App + API on http://localhost:3000  (docs at /docs)
```

Configuration is entirely via environment variables:

| Variable            | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `DATABASE_URL`      | Prisma connection string (SQLite by default)  |
| `API_AUTH_TOKEN`    | Bearer token for the REST API                 |
| `ANTHROPIC_API_KEY` | Server-side AI features (optional)            |
| `PORT` / `HOST`     | Where the server listens                      |

The database lives on the `bigrocks-data` volume (mounted at `/data`), so it
survives container restarts. Migrations are applied automatically on boot.

Swapping to Postgres later is a provider + `DATABASE_URL` change (an optional
`db` service is stubbed in `docker-compose.yml`) — no application code changes.

## Secrets

Never commit secrets. Only `.env.example` is tracked; the real `.env` is
gitignored. The Anthropic key and the API auth token must come from the
environment.

## Status

Built incrementally following the build order in `CLAUDE.md`. This is the
scaffold (step 1): the monorepo, the data model, a thin task slice, Docker, and
CI. Feature work (quadrant matrix, goals, people, renewal, AI, import) follows in
subsequent steps.
