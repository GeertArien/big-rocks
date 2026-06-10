# BigRocks UI/UX design — "Field Notes"

A design direction for BigRocks, evolved from the "Compass" prototype's warm,
editorial feel, but structured as a real product: an app shell with a sidebar
on desktop, bottom tabs + FAB on mobile, and surfaces for AI, notifications,
and agent integrations.

**Interactive mockup:** open [`mockup.html`](./mockup.html) in a browser.
Use the app's own navigation to move between screens, and the
**Desktop / Phone** toggle (top right) to preview both layouts — the phone
preview uses container queries, so it shows the genuine mobile layout, not a
shrunken desktop.

---

## Design principles

1. **Quadrant II is the protagonist.** Every screen visually privileges
   important-not-urgent work: Q2 gets the pine outline in the matrix, big
   rocks lead the Today screen, relationships and renewal get equal billing
   with tasks.
2. **Warm paper, not gray SaaS.** Cream paper background, ink text, serif
   display headings (Fraunces), terracotta/pine/gold accents. It should feel
   like a personal constitution, not a Jira board.
3. **Everything traces upward.** Tasks show their lineage (goal › project)
   as a breadcrumb; orphan tasks are gently flagged ("Inbox · no goal").
   Alignment is a visible property, not a report you run.
4. **Capture is one gesture away.** Global capture (⌘K bar on desktop, FAB
   on mobile) takes a plain sentence; the AI preview shows quadrant, goal,
   person, due date *before* saving, so trust is built by transparency.
5. **Nudge, don't shame.** Overdue commitments and slipped rocks appear as
   warm, actionable nudge cards with a one-tap resolution (Log / Plan),
   never as red error walls.

## Information architecture

| Surface | Purpose | Habit |
|---|---|---|
| **Today** | Daily dashboard: big-rock progress, today's tasks, relationship nudges, renewal rings, AI weekly review | all |
| **Plan** | Quadrant matrix + week navigation, big-rocks filter | 3 |
| **Goals** | Mission statement → goals (progress bars) → projects → tasks | 2 |
| **People** | Person cards with cadence status, occurrence history dots, log/plan actions | 4–6 |
| **Renew** | Four dimension cards with weekly targets and cross-links into goals/people/mission | 7 |
| **Settings & agents** | Notifications, AI job toggles, API keys + MCP endpoint, Todoist CSV import | — |

Navigation: persistent left sidebar (≥860px) with the mission excerpt pinned
at the bottom; bottom tab bar (5 tabs) + capture FAB on mobile. Settings is
reachable from the sidebar and the top-bar gear.

## Key patterns

- **Big rock chip** — starred tasks rendered as tactile chips on a dark
  "jar" card; filled when done. The 2/5 meter is the week's headline metric.
- **Task row** — checkbox, title, then a meta line: quadrant badge (Q1–Q4
  colored), lineage crumb, due chip (Today = terracotta, Overdue = red),
  trailing ★ to toggle big-rock status.
- **Nudge card** — icon + sentence + inline action button. Terracotta tint
  for overdue, gold tint for due-soon, plum tint for AI suggestions.
- **Cadence history** — 8 small squares (hit/miss) per commitment, with
  next-due or streak text. Honest about misses without being punitive.
- **Status pills** — on track (pine) / due soon (gold) / overdue (filled
  red), shared between People, Goals, and Today.

## Color & type tokens

| Token | Value | Use |
|---|---|---|
| paper / card | `#f5f1e8` / `#fcfaf4` | background / surfaces |
| ink | `#211d16` | text, primary buttons |
| terracotta | `#9c3b22` | primary accent, FAB, active tab |
| pine | `#2e5d4f` | Q2, success, on-track |
| gold | `#b3892b` | big-rock stars, due-soon |
| plum | `#5a4a8a` | AI surfaces, spiritual dimension |
| Q1–Q4 | red / pine / amber / stone | quadrant badges & headers |

Type: **Fraunces** (serif) for page titles, card headings, mission text;
**Inter** for everything else. Implementation keeps these as CSS variables in
`app.css` (replacing the default shadcn slate theme); shadcn-svelte
components pick them up via the existing token mapping. A dark "midnight
paper" theme can be derived later from the same tokens.

## Mobile & notifications

- Layout switches at 860px (container-based in the mockup; viewport media
  queries in the real app are fine).
- Bottom nav with safe-area padding; FAB above it for capture; sheets slide
  from the bottom (matches existing `Sheet` component usage).
- Web push (PWA, issue #10): notification types are user-toggleable —
  overdue commitments, morning big-rock nudge, AI weekly review (Sunday),
  with quiet hours. Notifications deep-link to the relevant nudge card.

## Integration surfaces (issue #7/#8)

Settings exposes the agent-facing side of the app without leaving the UI:
named API keys with read-only/read-write scope and revoke, a copyable MCP
endpoint, a link to the OpenAPI docs, AI job toggles, and the Todoist CSV
drop zone.

## ⚠ Open data-model question (needs approval before implementation)

The mockup shows **Projects** (and an optional sub-project level) between
Goal and Task: `Mission → Goal → Project → (Sub-project) → Task`. The
current approved model is `Mission → Goal → Task` with no Project entity.
Options:

1. **Add a `Project` entity** (`goalId` nullable, optional `parentId` for
   one level of nesting; `Task.projectId` nullable, keep `Task.goalId` or
   derive goal via project). Schema change — per the working agreement this
   needs explicit owner approval before any code.
2. **Ship the design without projects first** — goals expand directly into
   tasks; add projects later. The mockup degrades gracefully to this.

Everything else in the mockup uses the already-approved model.

## Suggested rollout

1. Re-theme: swap slate tokens for Field Notes tokens + Fraunces/Inter (small, high-impact).
2. App shell: sidebar / bottom-nav / FAB + global capture sheet.
3. Today dashboard (composes existing stores; nudges arrive with steps 4–5 / issues #5–#6).
4. Screen-by-screen: Plan polish → Goals (pending the project decision) → People → Renew → Settings.
