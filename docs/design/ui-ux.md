# BigRocks UI/UX design v2 — "Field Notes", three pillars

Second iteration. v1 ([`v1/mockup.html`](./v1/mockup.html),
[`v1/ui-ux.md`](./v1/ui-ux.md)) established the visual language — warm
paper, serif display type, terracotta/pine/gold — but its screens were loud:
the Today dashboard alone pushed five cards of competing information. v2
keeps the look and reorganizes everything around **three modes that are
lenses over one data layer**, per the owner's Clock & Compass spec
([`references/clock-compass-almanac-spec.md`](./references/clock-compass-almanac-spec.md)):

| Mode | Tense | Question it answers | Accent |
|---|---|---|---|
| **Compass** | Intent | What matters, and why? | pine |
| **Clock** | Plan | When will I actually do it? | terracotta |
| **Almanac** | Record | What did I actually do, over time? | gold |

A task is one thing seen three ways: its Compass attributes (project,
quadrant, big-rock flag) and its Clock attributes (scheduled day, time)
live on the same record; completing it anywhere completes it everywhere.

**Interactive mockup:** open [`mockup.html`](./mockup.html) in a browser.
Mode switch in the top bar (desktop) / bottom tabs (mobile); the
**Desktop / Phone** toggle previews both layouts via container queries.

**Folder layout:** `mockup.html` + this file are the current proposal;
[`v1/`](./v1/) holds the first iteration; [`references/`](./references/)
holds the owner's original prototypes that inspired each iteration —
[`seven-habits-planner-v1.html`](./references/seven-habits-planner-v1.html)
("The Compass"), [`seven-habits-planner-v2.html`](./references/seven-habits-planner-v2.html)
("The Clock & Compass"), and the three-pillar spec.

---

## Calm principles (what changed from v1)

1. **One question per screen.** The dense Today dashboard is gone. Each
   mode opens on a single primary surface; secondary views are quiet
   underline sub-tabs, not extra cards.
2. **One accent at a time.** The active mode sets the accent color for
   kickers, tabs, and primary buttons. Pills, badges, and nudges were cut
   back to the few that carry a decision.
3. **Detail folds away.** Projects, people, and goals are collapsed rows
   that expand in place (`<details>`); ledgers, task lists, and actions
   appear only when opened. Edit affordances appear on hover.
4. **Narrow reading column.** Content is capped at ~760px (~980px for the
   matrix and week views) instead of filling the frame.
5. **AI whispers.** One ✦ surface per mode at most: the capture preview,
   and a single weekly-review note at the end of Almanac → Trends. No
   inline AI chips scattered across screens.

## Information architecture

- **Compass** (sub-tabs): Mission & Goals → Projects → Matrix → People
  - *Mission & Goals*: mission centerpiece; goals grouped by **role**, each
    with a thin progress bar and target date.
  - *Projects*: collapsed project rows with lineage (`Goal › Role`); an
    unlinked project is flagged in text ("worth doing, or worth dropping?"),
    never blocked. Inbox of loose tasks at the bottom; deleting a project
    returns tasks to the Inbox.
  - *Matrix*: the quadrant lens over all tasks, Q2 outlined, big-rocks
    filter. Quadrant is the user's judgment — independent of due date.
  - *People*: one row per person — relationship, cadence status pill, and
    emotional-bank-account balance; expands to the ledger and log actions.
- **Clock**: one screen — week navigation, a "Rocks to place" tray
  (unscheduled starred tasks assigned to days via dropdown, no drag), and
  a Monday–Sunday agenda with today outlined. Default filter: big rocks.
- **Almanac** (sub-tabs): This week → Review & Trends
  - *This week*: four renewal-dimension cards aggregating tagged habits,
    then the habit list (check-today circle, 7-day dots, week-streak).
  - *Review & Trends*: this-week-vs-last, goal momentum (30 days, via
    linked habits), 12-week season heatmap, AI weekly review note.
  - Streaks count **consecutive weeks the target was met**; the current
    week never breaks a streak while in progress.
- **Settings & agents** (gear icon): notifications (web push / PWA), AI
  job toggles, API keys + MCP endpoint + OpenAPI link, Todoist CSV import.

Navigation: centered three-mode segmented switch in the top bar (desktop);
three bottom tabs + capture FAB (mobile). Capture (⌘K / FAB) opens a sheet
with an AI preview of quadrant, goal, person link, and day before saving.

## Tokens

Unchanged from v1: paper `#f5f1e8`, card `#fcfaf4`, ink `#211d16`,
terracotta `#9c3b22`, pine `#2e5d4f`, gold `#a07414`, plum `#5a4a8a` (AI),
Q1–Q4 badge colors; Fraunces for display, Inter for UI. New: a `--mode`
variable carries the active pillar's accent through the chrome.

## ⚠ Schema implications (need approval before implementation)

The approved model is `Mission → Goal → Task` (+ Person,
RecurringCommitment, RenewalDimension, RenewalActivity). v2 implies these
deltas, each an explicit decision:

1. **Role** — new entity above Goal (`Goal.roleId` nullable); role carries
   a name + optional mission line. Replaces "flat goal list" with grouping.
2. **Project** — new entity between Goal and Task (`Project.goalId`
   nullable, `Task.projectId` nullable). Flat (no sub-projects in v2).
3. **Task scheduling fields** — `scheduledDay` (date) and `scheduledTime`
   (optional) on Task, powering Clock mode. Quadrant stays derived from
   importance × urgency and independent of dates.
4. **Habit + HabitMark** — Almanac's habit model (name, optional
   RenewalDimension link, optional Goal link, `targetPerWeek`). This can
   *be* the existing RenewalActivity concept generalized, and should reuse
   the shared cadence logic that RecurringCommitment uses. Open question:
   does Habit absorb RenewalActivity, or sit alongside it?
5. **EBA entries** — People adds deposit/withdrawal ledger entries per
   person, alongside the existing occurrence log of RecurringCommitment.

## Suggested rollout

1. Re-theme + shell: Field Notes tokens, top-bar mode switch, bottom tabs,
   capture sheet (no schema changes; existing screens map to Compass).
2. Compass: Matrix polish, Projects + Inbox (after schema decision 1–2).
3. Clock: scheduling fields + week agenda (decision 3).
4. Almanac: habits, streaks, trends (decisions 4) — supersedes the v1
   Renew dashboard plan for issue #6.
5. People: cadence + EBA ledger (decision 5, issue #5).
6. Settings & agents surface (issues #7–#9), PWA/push (#10).
