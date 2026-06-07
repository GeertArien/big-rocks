# BigRocks

A personal todo and productivity app organized around the principles popularized in
Stephen Covey's *The 7 Habits of Highly Effective People*. Mainly for personal use,
but published publicly on GitHub.

> Inspired by the prioritization and effectiveness principles popularized by Stephen Covey.
> This project is not affiliated with or endorsed by the Covey/FranklinCovey organizations.

---

## Concept

The app is built around two pillars from the book, plus a renewal layer that ties them together:

- **Private Victory (Habits 1–3):** your solo, independent work — proactivity, goals, prioritization.
- **Public Victory (Habits 4–6):** interdependence — kept through recurring investment in the
  relationships that matter.
- **Sharpen the Saw (Habit 7):** self-renewal across four dimensions, stitching the two pillars together.

The "big rocks" metaphor (Quadrant II — important but not urgent) is the heart of the app:
put the big rocks in first, let the smaller tasks fill in around them.

---

## Habit → Feature map

- **Habit 1 — Be Proactive:** tasks/worries can be tagged *influence* (actionable) vs *concern*
  (not in your control), nudging focus toward what you can move. AI can help classify.
- **Habit 2 — Begin with the End in Mind:** a goals layer plus a personal mission statement.
  Tasks and big rocks can link to a goal so you see whether your week serves your larger aims.
- **Habit 3 — Put First Things First:** the quadrant matrix (importance × urgency) and a weekly
  "big rocks first" planning view. This is the core mechanic.
- **Habits 4/5/6 — Public Victory (recurring relationship commitments):** a list of the people who
  matter, each with recurring commitments on a cadence (e.g. monthly activity with each kid, regular
  date night with spouse, weekly call to parents). The app tracks cadence adherence and surfaces
  what's overdue.
- **Habit 7 — Sharpen the Saw:** a renewal dashboard across four dimensions — physical, mental,
  social/emotional, spiritual. The social/emotional dimension relates to the relationship commitments;
  the spiritual dimension relates to the mission statement; mental relates to learning goals.

---

## Recurring relationship commitments (detail)

This is the concrete shape of the Public Victory side. Each commitment:

- links to one or more **people** (e.g. a specific kid, spouse, parents)
- has a **target cadence** (e.g. weekly, every 2 weeks, monthly)
- keeps a **log of occurrences** (when you actually did it)
- shows a **status**: on track / due soon / overdue
- nudges when overdue ("no date night logged in 3 weeks")

OPEN DECISIONS to confirm with the owner before finalizing the model:
1. Per-person vs per-commitment tracking (e.g. each kid has their own monthly-activity streak,
   vs one shared "kids activity" that rotates).
2. Pass/fail per period vs a streak/history view showing patterns over time.

Default assumption if unspecified: per-person tracking with a streak/history view.

---

## Tech stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, and **shadcn/ui** for components. Mobile-first,
  responsive, installable as a PWA (add-to-homescreen, works offline). Mobile-friendliness is a hard
  requirement. shadcn/ui components are copied into the repo (owned in-source), giving a consistent,
  accessible, polished component set to build the quadrant matrix, planning views, dashboards, and forms.
- **Backend:** Node + Fastify (TypeScript). Chosen for schema-based validation and auto-generated
  OpenAPI docs, which serve the agent-facing API directly.
- **Database:** SQLite to start, accessed via Prisma. MUST stay modular so Postgres can be swapped in
  later by changing the provider + DATABASE_URL. All DB access goes through a repository/service layer —
  never call the ORM directly from route handlers.
- **AI:** server-side calls to the Anthropic API. Keep the AI provider behind an interface so it is
  swappable. Key supplied via env var, never committed.

---

## API (for other agents/services)

- The **REST API is the single source of truth** — all logic, validation, and data access live there.
- Auto-generate an **OpenAPI/Swagger** spec so agents can discover endpoints.
- **Token-based auth:** generate API keys, passed as a bearer header. Single-user model is fine.
- An **MCP server** is a THIN adapter that wraps the shared service layer as MCP tools. It must NOT
  duplicate business logic. Structure it as a **clearly separable in-repo module** — its own
  folder/package with its own optional entry point, importing the shared service layer rather than
  reaching into route handlers. It stays in this repo for now (do not split into a separate repo).
  This preserves a trivial extraction path later: if it ever needs to run independently, lift the module
  out and point it at the REST API over HTTP instead of importing the service layer — no logic rewrite.
- Endpoints should cover: task CRUD, quadrant queries ("what are my big rocks this week?"),
  goals, people + recurring commitments (and overdue queries), and a natural-language intake
  endpoint (POST a sentence → AI classifies into a quadrant → creates the task).

---

## AI integration jobs

- Classify a task into a quadrant from free text.
- Tag tasks as influence vs concern (Habit 1).
- Draft/refine the mission statement; flag tasks that connect to no goal (Habit 2).
- Weekly review summary ("3 of your 5 big rocks slipped; 2 relationship commitments are overdue").
- Natural-language task intake.

---

## Todoist import

- **Primary path: CSV import.** The user exports their tasks from Todoist (per-project CSV export, or a
  full-account backup export) and uploads the file in the frontend. No Todoist token, no OAuth, no rate
  limits, and nothing Todoist-related in the server env.
- Parse the export and map its fields (content, priority, due date, project) → BigRocks tasks/quadrants.
  Todoist p1–p4 priorities give a starting importance/urgency guess that the AI can refine.
- This is a frontend-initiated flow: the user picks a file; parsing can happen client-side or via a
  dedicated import endpoint that accepts the uploaded file. Either way, no Todoist credentials are stored.
- **Optional later enhancement:** a live Todoist API sync for repeatable re-imports. If added, the user
  supplies their own token at runtime through the UI — it is NOT a server-side env secret.

---

## Deployment (Docker)

- Multi-stage Dockerfile: build the frontend, then serve it as static files from the Fastify backend
  (single container).
- `docker-compose.yml` for the app (plus an optional Postgres service for later). Use named volumes for
  persistence — for SQLite, persist the DB file on a mapped volume so it survives container restarts.
- All config via env vars: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `API_AUTH_TOKEN`.
- Document the standard Docker setup in the README: building the image, the compose stack, exposed port,
  and volume mapping for DB persistence. Keep it host-agnostic — standard Docker / docker-compose only.

---

## Repo hygiene & conventions (public repo)

- `.env.example` documenting all env vars; the real `.env` is gitignored.
- **Never commit secrets** — the Anthropic API key and the API auth token. Todoist data comes from a
  user-uploaded export, so there are no Todoist credentials on the server.
- README with the Covey-inspired disclaimer (above), setup instructions, and a link to the API docs.
- All DB access goes through the repository/service layer — never call the ORM directly from route
  handlers (this is what keeps SQLite→Postgres and the MCP adapter clean).
- Include tests for the service layer and API; changes should not merge with failing tests.

---

## Suggested build order

1. Scaffold: Vite/React + TypeScript + Tailwind first and get it running; THEN initialize shadcn/ui
   (it needs Tailwind already configured and scaffolds its own `components.json`); THEN add the Fastify
   backend + Prisma/SQLite; Dockerize. Do not try to do all of this in one shot — the shadcn init must
   come after Tailwind is working.
2. Core task model + quadrant matrix + big-rocks weekly view (Habit 3).
3. Goals + mission statement (Habit 2); influence/concern tagging (Habit 1).
4. People + recurring relationship commitments with cadence tracking (Habits 4–6).
5. Sharpen-the-Saw renewal dashboard (Habit 7).
6. REST API hardening + OpenAPI + token auth; then the MCP adapter.
7. AI integration jobs.
8. Todoist CSV import (upload export → map → tasks).
9. PWA polish + mobile QA.

---

## Working agreement (how to collaborate on this repo)

- Tackle one build-order step at a time. Work each step on its own branch and open a PR; don't bundle
  unrelated steps into one change.
- For any change that touches the database schema or a core data model, propose it and wait for approval
  before writing code.
- Don't merge with failing tests or a broken build.
- Never commit secrets; confirm `.env` is gitignored and only `.env.example` is tracked.
- When starting fresh work, re-read this file first and propose a plan before coding.

(These are defaults. To override for a specific task — e.g. a tiny fix committed directly — say so in
that prompt.)
