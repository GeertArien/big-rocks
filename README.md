# BigRocks

A personal todo and productivity app organized around the principles popularized
in Stephen Covey's *The 7 Habits of Highly Effective People*. Put your big rocks
in first — let the smaller tasks fill in around them.

> Inspired by the prioritization and effectiveness principles popularized by
> Stephen Covey. This project is not affiliated with or endorsed by the
> Covey/FranklinCovey organizations.

## Architecture

A pnpm monorepo. All business logic lives in **`packages/core`** (the single
source of truth); the HTTP layer and the MCP adapter are thin consumers.

```
apps/
  web/      Svelte 5 + Vite + TypeScript + Tailwind + shadcn-svelte (mobile-first, PWA-ready SPA)
  server/   Fastify HTTP layer — thin routes that call core; serves the built web app
packages/
  core/     Prisma schema + client, repositories, services, AI provider interface
  mcp/      MCP server (stdio) wrapping the core services as agent tools
```

- **Repositories** are the only code that touches Prisma. Services depend on
  repository interfaces, which keeps the SQLite→Postgres swap and the MCP
  adapter clean.
- The **quadrant** (importance × urgency) is always *derived*, never stored.
- The **REST API is the source of truth**, with an auto-generated OpenAPI spec at
  `/docs` and bearer-token auth: the `API_AUTH_TOKEN` admin token, or named
  **API keys** generated in Settings (hash-only storage, revocable).
- The **MCP server** (`pnpm --filter @big-rocks/mcp start`, with `DATABASE_URL`
  set) exposes the same services as tools for agents — tasks, quadrants, big
  rocks, goals, people, commitments, habits, and renewal.

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
docker compose up --build

# App + API on http://localhost:3000  (docs at /docs)
```

By default the instance is **open** (no auth) — fine for a single-user box on
your own network. To require a bearer token on the API, set `API_AUTH_TOKEN`
(e.g. `API_AUTH_TOKEN=$(openssl rand -hex 32) docker compose up`) and enter the
same token in the web UI's settings (gear icon).

Configuration is entirely via environment variables:

| Variable            | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `DATABASE_URL`      | Prisma connection string (SQLite by default)             |
| `API_AUTH_TOKEN`    | Bearer token for the REST API (unset = open, the default)|
| `ANTHROPIC_API_KEY` | Server-side AI features (optional; see `.env.example` for the OpenAI-compatible alternative) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push notifications (optional; generate with `pnpm --filter @big-rocks/server exec web-push generate-vapid-keys`) |
| `PORT` / `HOST`     | Where the server listens                                 |

The app is an installable PWA (add-to-homescreen; the shell and fonts work
offline). With VAPID keys set, enable push per device in Settings →
Notifications — overdue commitments, the morning rock reminder, and the Sunday
review arrive even with the app closed. Push requires HTTPS (or localhost).

The database lives on the `bigrocks-data` volume (mounted at `/data`), so it
survives container restarts. Migrations are applied automatically on boot.

Swapping to Postgres later is a provider + `DATABASE_URL` change (an optional
`db` service is stubbed in `docker-compose.yml`) — no application code changes.

### Run the prebuilt image (no local build)

CI publishes the image to GitHub Container Registry on every push to `main` and
on version tags. To run it without building:

```bash
docker run -p 3000:3000 -v bigrocks-data:/data ghcr.io/geertarien/big-rocks:latest
# → http://localhost:3000  (open by default; add -e API_AUTH_TOKEN=… to require a token)
```

If the package is private, first authenticate:
`echo <github-pat> | docker login ghcr.io -u <username> --password-stdin`
(or make the package public in the repo's *Packages* settings for anonymous pulls).

## Secrets

Never commit secrets. Only `.env.example` is tracked; the real `.env` is
gitignored. The Anthropic key and the API auth token must come from the
environment.

## Status

Built incrementally following the build order in `CLAUDE.md`.

- **Step 1** — scaffold: monorepo, data model, Docker, CI.
- **Step 2** — the interactive quadrant matrix (create tasks, move between
  quadrants by toggling importance/urgency, complete/reopen, delete) and the
  weekly "big rocks first" view.
- **Step 3** — Goals (first-class, with derived progress) + a versioned mission
  statement (Habit 2), and influence/concern tagging on tasks (Habit 1); tasks
  can be linked to a goal.
- **UX foundation** — app shell with mobile bottom-nav / desktop top-bar,
  responsive drawer (Sheet) for create/edit, confirm dialogs on delete,
  optimistic updates with toast feedback, and consistent loading/empty/error
  states.
- **Design + shell** — approved "Field Notes" design (`docs/design/ui-ux.md`):
  three modes as tenses (Compass defines, Clock does, Almanac remembers),
  warm paper/ink theme, serif display type, and a new Clock · Today home
  screen. Next: roles + projects, task scheduling, people + commitments,
  habits + renewal, AI, import.
