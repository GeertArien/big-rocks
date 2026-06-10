<script lang="ts">
  import { Check, Star } from "lucide-svelte";
  import TaskCard from "./TaskCard.svelte";
  import { Button } from "@/lib/components/ui/button";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import { projectsStore } from "@/lib/stores/projects.svelte";
  import { navStore } from "@/lib/stores/nav.svelte";
  import { formatTime, isSameLocalDay } from "@/lib/week";

  const loadingFirst = $derived(tasksStore.loading && tasksStore.tasks.length === 0);

  const rocks = $derived(tasksStore.tasks.filter((t) => t.isBigRock));
  const rocksDone = $derived(rocks.filter((t) => t.status === "DONE").length);
  const meterPct = $derived(rocks.length ? Math.round((rocksDone / rocks.length) * 100) : 0);

  function isDueByToday(due: string | null): boolean {
    if (!due) return false;
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    return due.slice(0, 10) <= today;
  }

  // Scheduled for today (the Clock lens), in time order.
  const scheduledToday = $derived(
    tasksStore.tasks
      .filter((t) => isSameLocalDay(t.scheduledDay, new Date()))
      .sort((a, b) => (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99")),
  );
  // Plus open tasks due today or earlier that aren't already on today's schedule.
  const dueToday = $derived(
    tasksStore.tasks.filter(
      (t) =>
        t.status !== "DONE" &&
        isDueByToday(t.dueDate) &&
        !isSameLocalDay(t.scheduledDay, new Date()),
    ),
  );

  function crumb(taskProjectId: string | null): string {
    const project = projectsStore.byId(taskProjectId);
    return project ? `▤ ${project.name}` : "⌂ Inbox";
  }
</script>

<section class="flex flex-col gap-4">
  {#if tasksStore.error}
    <div
      class="flex items-center justify-between gap-2 rounded-md border border-[var(--terra)] bg-[var(--terra-soft)] px-3 py-2 text-sm text-[var(--terra)]"
    >
      <span>{tasksStore.error}</span>
      <Button variant="outline" size="sm" onclick={() => tasksStore.load()}>Retry</Button>
    </div>
  {/if}

  {#if loadingFirst}
    <div class="h-40 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"></div>
  {:else}
    <!-- The jar: this week's big rocks, placed before anything else fills it. -->
    <div
      class="flex flex-col gap-3 rounded-xl p-4 text-[#f0ead9] shadow-sm"
      style="background: linear-gradient(135deg, #2c2820 0%, #3a3326 100%)"
    >
      <div class="flex items-center gap-2">
        <Star class="size-4 text-[var(--star)]" fill="currentColor" />
        <h2 class="font-display text-base font-semibold text-[#f7f2e4]">
          This week's big rocks
        </h2>
        <button
          onclick={() => navStore.go("clock", "week")}
          class="ml-auto text-xs font-semibold text-[#d8b96a] hover:underline"
        >
          Week view →
        </button>
      </div>

      {#if rocks.length === 0}
        <p class="font-display text-sm italic text-[#b8ad92]">
          The jar is empty — pin Q2 tasks as big rocks in the Week view.
        </p>
      {:else}
        <div class="flex flex-wrap gap-2">
          {#each rocks as rock (rock.id)}
            {@const done = rock.status === "DONE"}
            <button
              onclick={() => tasksStore.toggleComplete(rock)}
              title={done ? "Reopen" : "Complete"}
              class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors {done
                ? 'border-[#5e9e8673] bg-[#5e9e8638] text-[#ece5d2]'
                : 'border-[#fffdf724] bg-[#fffdf714] text-[#ece5d2] hover:border-[#fffdf748]'}"
            >
              {#if done}
                <Check class="size-3.5" />
                <span class="line-through opacity-75">{rock.title}</span>
              {:else}
                <Star class="size-3 text-[var(--star)]" fill="currentColor" />
                <span>{rock.title}</span>
              {/if}
            </button>
          {/each}
        </div>
        <div class="flex items-center gap-3">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#fffdf724]">
            <div
              class="h-full rounded-full bg-[var(--star)] transition-all"
              style={`width: ${meterPct}%`}
            ></div>
          </div>
          <span class="font-display text-sm">{rocksDone} / {rocks.length}</span>
        </div>
      {/if}
    </div>

    <!-- Today's agenda: scheduled slots, then due-today items. -->
    <div
      class="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm"
    >
      <h2 class="font-display text-base font-semibold">Today's agenda</h2>
      <p class="-mt-1 text-xs text-[var(--color-muted-foreground)]">
        Scheduled for today, then anything due.
      </p>

      {#if scheduledToday.length > 0}
        <div class="flex flex-col">
          {#each scheduledToday as task (task.id)}
            {@const done = task.status === "DONE"}
            <div class="flex items-center gap-2.5 border-b border-dotted border-[var(--color-border)] py-2 last:border-b-0">
              <button
                onclick={() => tasksStore.toggleComplete(task)}
                aria-label={done ? "Reopen task" : "Complete task"}
                class="flex size-5 shrink-0 items-center justify-center rounded-full border {done
                  ? 'border-[var(--pine)] bg-[var(--pine)] text-white'
                  : 'border-[var(--color-input)] text-transparent'}"
              >
                <Check class="size-3" />
              </button>
              <span class="w-14 shrink-0 text-xs font-semibold {task.scheduledTime ? 'text-[var(--terra)]' : 'text-[var(--color-input)]'}">
                {formatTime(task.scheduledTime) ?? "—"}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm" class:line-through={done} class:text-[var(--color-muted-foreground)]={done}>
                  {#if task.isBigRock}<span class="text-[var(--star)]">★</span>{/if}
                  {task.title}
                </p>
                <p class="text-[11px] text-[var(--color-muted-foreground)]">{crumb(task.projectId)}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex flex-col gap-2">
        {#each dueToday as task (task.id)}
          <TaskCard {task} />
        {:else}
          {#if scheduledToday.length === 0}
            <p class="py-2 text-center font-display text-sm italic text-[var(--color-muted-foreground)]">
              Nothing scheduled or due — a good day to place a rock.
            </p>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</section>
