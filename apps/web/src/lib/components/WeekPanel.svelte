<script lang="ts">
  import { Check, ChevronLeft, ChevronRight, RotateCcw, Star, X } from "lucide-svelte";
  import TaskCard from "./TaskCard.svelte";
  import { Button } from "@/lib/components/ui/button";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import { projectsStore } from "@/lib/stores/projects.svelte";
  import { formatTime, isSameLocalDay, weekDays } from "@/lib/week";
  import type { Task } from "@/lib/api";

  let offset = $state(0);
  let rocksOnly = $state(true);

  const days = $derived(weekDays(offset));
  const today = new Date();

  const rangeLabel = $derived.by(() => {
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(days[0]!)} – ${fmt(days[6]!)}`;
  });

  // The tray: starred rocks with no day yet. Schedule these first.
  const unplacedRocks = $derived(
    tasksStore.tasks.filter((t) => t.isBigRock && t.status !== "DONE" && !t.scheduledDay),
  );
  // Q2 tasks that could still be starred into the week.
  const candidates = $derived(
    tasksStore.tasks.filter(
      (t) => t.quadrant === "Q2" && !t.isBigRock && t.status !== "DONE",
    ),
  );

  function slotsFor(day: Date): Task[] {
    return tasksStore.tasks
      .filter((t) => isSameLocalDay(t.scheduledDay, day))
      .filter((t) => !rocksOnly || t.isBigRock)
      .sort((a, b) => (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99"));
  }

  function crumb(task: Task): string {
    const project = projectsStore.byId(task.projectId);
    return project ? `▤ ${project.name}` : "⌂ Inbox";
  }

  function place(task: Task, dayIso: string) {
    if (dayIso) tasksStore.setScheduledDay(task, new Date(dayIso).toISOString());
  }
</script>

<section class="flex flex-col gap-4">
  <!-- Week navigation + filter -->
  <div class="flex flex-wrap items-center gap-2">
    <div
      class="flex items-center gap-0.5 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] p-0.5"
    >
      <button
        onclick={() => (offset -= 1)}
        aria-label="Previous week"
        class="flex size-7 items-center justify-center rounded-md hover:bg-[var(--color-accent)]"
      >
        <ChevronLeft class="size-4" />
      </button>
      <span class="min-w-28 px-1 text-center font-display text-sm font-semibold">{rangeLabel}</span>
      <button
        onclick={() => (offset += 1)}
        aria-label="Next week"
        class="flex size-7 items-center justify-center rounded-md hover:bg-[var(--color-accent)]"
      >
        <ChevronRight class="size-4" />
      </button>
    </div>
    {#if offset !== 0}
      <Button variant="outline" size="sm" onclick={() => (offset = 0)}>Today</Button>
    {/if}
    <div class="ml-auto flex overflow-hidden rounded-lg border border-[var(--color-input)] bg-[var(--color-card)]">
      <button
        onclick={() => (rocksOnly = true)}
        class="px-3 py-1.5 text-xs font-semibold {rocksOnly
          ? 'bg-[var(--mode)] text-white'
          : 'text-[var(--color-muted-foreground)]'}"
      >
        ★ Big rocks
      </button>
      <button
        onclick={() => (rocksOnly = false)}
        class="px-3 py-1.5 text-xs font-semibold {!rocksOnly
          ? 'bg-[var(--mode)] text-white'
          : 'text-[var(--color-muted-foreground)]'}"
      >
        All scheduled
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-[16rem_1fr]">
    <!-- Rocks to place -->
    <div class="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm">
      <div class="flex items-center gap-2">
        <Star class="size-4 text-[var(--star)]" fill="currentColor" />
        <h2 class="font-display text-[0.9375rem] font-semibold">Rocks to place</h2>
        <span class="text-xs text-[var(--color-muted-foreground)]">{unplacedRocks.length}</span>
      </div>
      <p class="-mt-1 text-xs text-[var(--color-muted-foreground)]">
        Schedule these into the week first — the small stuff fills the gaps.
      </p>
      {#each unplacedRocks as rock (rock.id)}
        <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2.5">
          <p class="text-sm leading-snug font-medium">{rock.title}</p>
          <p class="mt-0.5 text-[0.6875rem] text-[var(--color-muted-foreground)]">{crumb(rock)}</p>
          <select
            value=""
            onchange={(e) => place(rock, (e.currentTarget as HTMLSelectElement).value)}
            aria-label="Place on a day"
            class="mt-1.5 w-full rounded-md border border-[var(--color-input)] bg-transparent px-2 py-1 text-xs text-[var(--color-muted-foreground)]"
          >
            <option value="">place on…</option>
            {#each days as day (day.toISOString())}
              <option value={day.toISOString()}>
                {day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </option>
            {/each}
          </select>
        </div>
      {:else}
        <p class="py-1 font-display text-sm italic text-[var(--color-muted-foreground)]">
          Nothing waiting — every rock has its day.
        </p>
      {/each}

      {#if candidates.length > 0}
        <details class="mt-1">
          <summary class="cursor-pointer text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            Q2 candidates to star ({candidates.length})
          </summary>
          <div class="mt-2 flex flex-col gap-2">
            {#each candidates as task (task.id)}
              <TaskCard {task} />
            {/each}
          </div>
        </details>
      {/if}
    </div>

    <!-- The week, Monday–Sunday -->
    <div class="flex flex-col gap-2.5">
      {#each days as day (day.toISOString())}
        {@const isToday = isSameLocalDay(today.toISOString(), day)}
        {@const slots = slotsFor(day)}
        <div
          class="rounded-xl border bg-[var(--color-card)] shadow-sm {isToday
            ? 'border-[var(--terra)] ring-1 ring-[var(--terra)]'
            : 'border-[var(--color-border)]'}"
        >
          <div class="flex items-baseline gap-2 border-b border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-3.5 py-1.5">
            <span class="font-display text-sm font-semibold">
              {day.toLocaleDateString(undefined, { weekday: "long" })}
            </span>
            <span class="text-xs text-[var(--color-muted-foreground)]">
              {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            {#if isToday}
              <span class="ml-auto text-[0.625rem] font-bold tracking-widest text-[var(--terra)]">TODAY</span>
            {/if}
          </div>
          <div class="px-3.5 py-1">
            {#each slots as task (task.id)}
              {@const done = task.status === "DONE"}
              <div class="flex items-center gap-2.5 border-b border-dotted border-[var(--color-border)] py-2 last:border-b-0">
                <button
                  onclick={() => tasksStore.toggleComplete(task)}
                  aria-label={done ? "Reopen task" : "Complete task"}
                  class="flex size-5 shrink-0 items-center justify-center rounded-full border {done
                    ? 'border-[var(--pine)] bg-[var(--pine)] text-white'
                    : 'border-[var(--color-input)] text-transparent hover:text-[var(--color-muted-foreground)]'}"
                >
                  {#if done}<Check class="size-3" />{:else}<RotateCcw class="size-3 opacity-0" />{/if}
                </button>
                <span class="w-14 shrink-0 text-xs font-semibold {task.scheduledTime ? 'text-[var(--terra)]' : 'text-[var(--color-input)]'}">
                  {formatTime(task.scheduledTime) ?? "—"}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm" class:line-through={done} class:text-[var(--color-muted-foreground)]={done}>
                    {#if task.isBigRock}<span class="text-[var(--star)]">★</span>{/if}
                    {task.title}
                  </p>
                  <p class="text-[0.6875rem] text-[var(--color-muted-foreground)]">{crumb(task)}</p>
                </div>
                <input
                  type="time"
                  value={task.scheduledTime ?? ""}
                  onchange={(e) =>
                    tasksStore.setScheduledTime(task, (e.currentTarget as HTMLInputElement).value || null)}
                  aria-label="Set a time"
                  class="w-[4.7rem] shrink-0 rounded-md border border-[var(--color-input)] bg-transparent px-1 py-0.5 text-[0.6875rem] text-[var(--color-muted-foreground)]"
                />
                <button
                  onclick={() => tasksStore.setScheduledDay(task, null)}
                  aria-label="Unschedule"
                  title="Unschedule (back to the tray)"
                  class="flex size-6 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--destructive)]"
                >
                  <X class="size-3.5" />
                </button>
              </div>
            {:else}
              <p class="py-1.5 font-display text-sm italic text-[var(--color-input)]">—</p>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
