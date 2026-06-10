# The Clock & Compass — Three-Pillar Design Specification

A single-page life-planning app built around Stephen Covey's *7 Habits of Highly Effective People*. The user's data persists across sessions. The whole app is organized into three "modes" that share one underlying picture of the user's life.

## Core concept: three modes, one data layer

The app is organized into three top-level **modes**, switched via a control in the masthead. Each mode owns one "tense" of planning:

| Mode | Tense | Question it answers | Covey anchor |
|------|-------|---------------------|--------------|
| **Compass** | Intent | *What matters, and why?* | Habits 2 & 3 (and 4/5) |
| **Clock** | Plan | *When will I actually do it?* | Habit 3 |
| **Almanac** | Record | *What did I actually do, over time?* | Habit 7 |

The metaphor: the compass tells you which way (aspiration), the clock tells you when (schedule), the almanac tells you how you're trending (evidence). The naming intentionally uses three tangible instruments.

Crucially, the three modes are **lenses over a shared picture**, not three separate apps. A single task carries both its Compass attributes (project, quadrant, big-rock flag) and its Clock attributes (scheduled day, time). Completing it in one mode completes it everywhere, because it's one thing seen three ways.

---

## Mode 1 — Compass (what matters and why)

Compass mode contains five tabs:

### Roles & Goals (Habits 2 & 3)
The user defines the **roles** they play in life (Parent, Professional, Self, etc.), each with an optional mission statement, and lists **goals** under each role. This is the top of the alignment hierarchy: role → goal.

### Projects (Habits 2 & 3)
A **project** is a multi-step outcome ("Launch Q3 newsletter"). Each project optionally links to a goal. The link is shown as a lineage breadcrumb (`Goal › Role`) so alignment is always visible. Projects have a status (active / someday / done).

Design principle: alignment is encouraged but never forced. A project with no goal is flagged ("Not linked to a goal — worth doing, or worth dropping?") rather than blocked. This surfaces misalignment honestly without making the app rigid.

Tasks live under projects. Each task has: text, a **quadrant** (see below), an optional due date, an optional big-rock flag, and (from Clock mode) optional scheduling fields. An **Inbox** holds loose tasks with no project; they can be moved into a project via a dropdown. Deleting a project sends its tasks back to the Inbox rather than destroying them.

### Weekly Compass (Habit 3)
Covey's **time-management matrix** — the four quadrants by importance × urgency:

- Q1: Urgent & Important (manage)
- Q2: Important, Not Urgent (focus here — the effective life lives in Q2)
- Q3: Urgent, Not Important (minimize)
- Q4: Not Urgent, Not Important (eliminate)

This is a **live lens**, not a separate list: it reads every task from all projects and the Inbox, grouped by quadrant, each task showing its project breadcrumb. A toggle filters between "all tasks" and "this week's Big Rocks" (the starred Q2-type tasks the user commits to).

Important design decision: **quadrant and due date are independent fields**. Urgency is a human judgment, deliberately not auto-derived from the due date, because the act of classifying is the reflective value of the matrix.

### Bank Accounts (Habits 4 & 5)
An **Emotional Bank Account** per relationship. The user logs deposits (+1) and withdrawals (−1) with notes; a running balance is shown. These are relational, not habits, so they stay in Compass mode (not absorbed into the Almanac).

### Sharpen the Saw (Habit 7)
The four renewal dimensions (Physical, Mental, Social/Emotional, Spiritual), each with a 7-day completion dot grid and a weekly intention note. This is intentionally **kept** even though the Almanac has a parallel renewal panel — they are two coexisting lenses on renewal, by design.

---

## Mode 2 — Clock (when each thing happens)

A weekly agenda for scheduling tasks into actual days. Covey's "put first things first" / big-rocks-in-the-jar idea made literal: schedule the important things first, let small things fill the gaps.

- The week runs **Monday–Sunday**, with back/forward navigation and a "Today" jump.
- A left-hand **"Big Rocks to place"** panel lists unscheduled starred tasks. Each is assigned to a day via a dropdown.
- Seven **day cards** list their scheduled tasks in time order, today's card highlighted. Each scheduled task shows an optional time (set inline via a time picker), its project breadcrumb, a done checkbox, and an × to unschedule (send back to the panel).
- Default view filters to **Big Rocks only**, with an "All scheduled" toggle.

Design decisions for v1 (deliberately lightweight, upgradeable later):
- Scheduling is **dropdown/click based**, not drag-and-drop.
- The day view is a **light ordered agenda**, not an hour-by-hour time grid.
- Week starts Monday; completing a task marks it done in all modes.

---

## Mode 3 — Almanac (the record over time)

The habit- and progress-tracking pillar. Contains four sections:

### Renewal This Week
The four renewal dimensions as cards. Each **aggregates the habits tagged to that dimension**, showing completions against the summed weekly target, with a progress bar. This is the Almanac's parallel to Sharpen-the-Saw, richer because it's driven by real habits.

### Habits
A list of user-defined habits. Each habit has:
- A name.
- An **optional dimension tag** (physical/mental/social/spiritual). Dimensions are optional but first-class — tagged habits feed the renewal panel; untagged habits are fine and simply don't count toward renewal.
- An **optional goal link** — threads habit → goal → role, and feeds goal-momentum trends.
- A **target cadence**: either daily (7/week) or N times per week (1–6).

Per habit, the user sees: a check-off-today button, a 7-day clickable week row (future days locked), this-week progress (e.g. "2/3"), and a **week-streak** count.

### Streak model (important)
Because targets are flexible, a "streak" counts **consecutive weeks the target was met**, not consecutive days. Key rule: the **current week never breaks a streak while still in progress** — an incomplete current week simply doesn't count yet; it extends the streak only once the target is met. Past weeks that missed the target break the chain.

### Review & Trends
- **This week vs last**: total completions with an up/down delta, plus the longest active streak.
- **Goal momentum** (last 30 days): for each goal that has linked habits, the percent of target completions achieved.
- **The season**: a 12-week heatmap across all habits, intensity by daily completion count.

---

## How the data connects (conceptually)

The structure threads together so that everything traces back to what matters:

- A **role** contains **goals**.
- A **goal** can have **projects** under it (and projects hold **tasks**).
- A **goal** can also have **habits** linked to it.
- A **task** carries both its Compass attributes (which project, which quadrant, whether it's a Big Rock) and its Clock attributes (which day, what time) — it's a single thing seen through different lenses.
- A **habit** can be tagged to a renewal dimension and/or linked to a goal.

Links are optional throughout: a project need not serve a goal, a task need not belong to a project (it sits in the Inbox), a habit need not have a dimension or goal. The chain is there to follow when the user wants it, never enforced.

---

## Cross-cutting design principles

1. **Three lenses, one underlying model.** The same item shows up differently in each mode rather than being duplicated. Completing or changing it anywhere updates it everywhere.
2. **Alignment encouraged, never forced.** Misalignment is gently surfaced (an unaligned project is flagged, loose tasks go to an Inbox) rather than blocked.
3. **Human judgment over automation.** The user classifies a task's quadrant themselves; it isn't auto-derived from the due date, because the act of judging is the point.
4. **Nothing destructive.** Deletes degrade gracefully — deleting a project returns its tasks to the Inbox rather than removing them.
5. **Covey-faithful flow.** Big Rocks get scheduled first; Quadrant II is the emphasized place to live; renewal is tracked over time, not just planned.

---

## Aesthetic (optional, for visual continuity)

An "old paper / personal constitution" theme: warm parchment background, serif display type (Palatino/Iowan) for headings and editorial text, sans-serif for UI, a deep terracotta + pine + gold accent palette, subtle paper texture, soft shadows. Each mode has an accent color (Compass = pine green, Clock = terracotta, Almanac = gold). The masthead carries a compass-rose mark and the three-mode switch with small glyphs (↻ compass, ◗ clock, ⚉ almanac).
