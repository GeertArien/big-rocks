# The Clock & Compass UI/UX design v3 — "Field Notes": Compass defines, Clock does, Almanac remembers

Third iteration. v1 ([`v1/`](./v1/)) set the visual language; v2
([`v2/`](./v2/)) adopted the owner's three-pillar Clock & Compass spec
([`references/clock-compass-almanac-spec.md`](./references/clock-compass-almanac-spec.md))
and calmed the screens — but it sorted *entities* into modes, which made
the Compass/Almanac boundary blurry (renewal split across both) and left
"doing" (today's rocks, today's check-ins) with no home. v3 fixes that
with one rule:

> **Compass defines. Clock does. Almanac remembers.**

Modes are *tenses*, not containers. Every entity is **defined** in
Compass (intent), **acted on** in Clock (now), and **reviewed** in
Almanac (record). A habit is the clearest example: defined in
Compass → Renew (dimension, cadence, goal link, weekly intention),
checked off in Clock → Today, trended in Almanac. The Almanac is
**read-only by design** — nothing is created or edited there, which is
what keeps the boundary crisp.

**Interactive mockup:** open [`mockup.html`](./mockup.html) in a browser.
It boots into **Clock → Today**, the everyday home screen. Mode switch in
the top bar (desktop) / bottom tabs (mobile); the **Desktop / Phone**
toggle previews both layouts via container queries.

**Folder layout:** `mockup.html` + this file are the current proposal;
[`v1/`](./v1/) and [`v2/`](./v2/) hold earlier iterations;
[`references/`](./references/) holds the owner's original prototypes
("The Compass", "The Clock & Compass") and the three-pillar spec.

---

## Information architecture

- **Compass** (pine — intent): Mission & Goals · Projects · Matrix · People · Renew
  - *Mission & Goals*: mission centerpiece; goals as expandable cards
    (progress bar, status pill, target date) grouped under role headers;
    a goal expands to its projects and linked habits with a jump to the
    Projects tab. (v1's goal cards, kept from owner feedback.)
  - *Projects*: collapsed cards with lineage (`Goal › Role`); unlinked
    projects flagged in text, never blocked; Inbox of loose tasks below.
  - *Matrix*: the quadrant lens over all tasks; rows carry full context —
    project (▤), person (♥), goal (◎), inbox (⌂) crumbs and due chips.
    Quadrant is the user's judgment, independent of due date.
  - *People*: v1-style cards in a two-column grid — avatar, relationship,
    status pill, commitment + cadence, 8-period hit/miss history, log /
    plan-as-rock actions; EBA balance pill with the ledger folded behind
    a disclosure.
  - *Renew*: the four dimensions as definition cards — each lists its
    habits (name, cadence, goal link, passive this-week count), an
    add-habit affordance, a "feeds" link chip, and the weekly intention
    line. No check-offs here.
- **Clock** (terracotta — now): Today · Week
  - *Today* (default landing): the dark big-rocks jar card (chips + 2/5
    meter), at most one nudge (overdue commitment that's also an unplaced
    rock), today's agenda (scheduled slots + due-today items with
    crumbs), and habit check-ins (circle, dimension tag, week count).
  - *Week*: rocks-to-place tray (dropdown scheduling, no drag) +
    Monday–Sunday agenda, today outlined.
- **Almanac** (gold — record, strictly read-only): Review · The Season
  - *Review*: renewal aggregates per dimension, this-week-vs-last with
    delta, goal momentum (30 days via linked habits), AI weekly review.
  - *The Season*: per-habit streak rows (this week's marks, week-streak)
    and the 12-week heatmap. Streaks count **weeks the target was met**;
    an unfinished current week never breaks the chain.
- **Settings & agents** (gear): notifications (web push / PWA), AI job
  toggles, API keys + MCP endpoint + OpenAPI link, Todoist CSV import.

Navigation: centered three-mode switch (desktop) / three bottom tabs +
capture FAB (mobile). Capture (⌘K / FAB) opens a sheet with an AI preview
of quadrant, goal, person link, and day before saving.

## Calm principles (carried from v2)

One question per screen; sub-tabs instead of stacked dashboards; collapsed
detail rows; ~760px reading column (≈980px for matrix/week/people grids);
one accent at a time (`--mode` variable); AI limited to the capture
preview and one weekly-review note.

The one deliberate exception is Clock → Today: it is allowed to aggregate
(rocks + agenda + check-ins) because "what do I do right now?" is one
question — that's the v1 dashboard, reborn in the correct tense and
trimmed to three surfaces.

## Tokens

Unchanged: paper `#f5f1e8`, card `#fcfaf4`, ink `#211d16`, terracotta
`#9c3b22`, pine `#2e5d4f`, gold `#a07414`, plum `#5a4a8a` (AI), star
`#b3892b`, Q1–Q4 badge colors; Fraunces display / Inter UI.

## Schema deltas (all five APPROVED by the owner, 2026-06-10)

Same five deltas as v2, unchanged by v3 (v3 only moves *where* things
appear, not what exists):

1. **Role** — entity above Goal (`Goal.roleId` nullable), name + mission line.
2. **Project** — entity between Goal and Task (`Project.goalId` nullable,
   `Task.projectId` nullable), flat.
3. **Task scheduling fields** — `scheduledDay` / `scheduledTime` on Task.
4. **Habit + HabitMark** — name, optional RenewalDimension link, optional
   Goal link, `targetPerWeek`; reuses shared cadence logic. RESOLVED
   (owner): Habit does **not** absorb RenewalActivity — habits cover
   recurring renewal; RenewalActivity stays for one-offs (a retreat, a
   long hike). Dimension aggregates count both; streaks are habit-only.
5. **EBA entries** — deposit/withdrawal ledger per person, alongside
   RecurringCommitment occurrences.

## Suggested rollout

1. Re-theme + shell: tokens, mode switch, bottom tabs, capture sheet.
2. Compass: Matrix polish; Mission & Goals; Projects + Inbox (decisions 1–2).
3. Clock: Today + Week (decision 3) — Today composes existing task data
   before habits exist; check-ins arrive with step 5.
4. People: cadence + EBA ledger (decision 5, issue #5).
5. Renew definitions + Almanac record (decision 4, issue #6).
6. Settings & agents surface (issues #7–#9), PWA/push (#10).
