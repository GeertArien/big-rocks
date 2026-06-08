<script lang="ts">
  import { Target, Trash2 } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { GOAL_STATUS_LABELS, goalsStore } from "@/lib/stores/goals.svelte";
  import type { GoalStatus } from "@/lib/api";

  let title = $state("");
  let submitting = $state(false);

  const statuses: GoalStatus[] = ["ACTIVE", "ON_HOLD", "ACHIEVED", "DROPPED"];

  async function add(e: Event) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    submitting = true;
    await goalsStore.add({ title: t });
    title = "";
    submitting = false;
  }

  function pct(ratio: number): number {
    return Math.round(ratio * 100);
  }
</script>

<section class="flex flex-col gap-4">
  <form
    onsubmit={add}
    class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm sm:flex-row sm:items-center"
  >
    <Input bind:value={title} placeholder="Add a goal…" aria-label="Goal title" class="flex-1" />
    <Button type="submit" size="sm" disabled={submitting || !title.trim()}>Add goal</Button>
  </form>

  {#if goalsStore.error}
    <div class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {goalsStore.error}
    </div>
  {/if}

  <div class="flex flex-col gap-3">
    {#each goalsStore.goals as goal (goal.id)}
      <div class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <Target class="size-4 text-[var(--color-muted-foreground)]" />
            <h3 class="text-sm font-semibold">{goal.title}</h3>
          </div>
          <button
            onclick={() => goalsStore.remove(goal)}
            aria-label="Delete goal"
            title="Delete goal"
            class="flex size-6 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-red-600"
          >
            <Trash2 class="size-3.5" />
          </button>
        </div>

        {#if goal.description}
          <p class="text-xs text-[var(--color-muted-foreground)]">{goal.description}</p>
        {/if}

        <!-- Derived progress -->
        <div class="flex items-center gap-2">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
            <div class="h-full bg-emerald-500" style={`width: ${pct(goal.progress.ratio)}%`}></div>
          </div>
          <span class="w-20 text-right text-xs text-[var(--color-muted-foreground)]">
            {goal.progress.done}/{goal.progress.total} · {pct(goal.progress.ratio)}%
          </span>
        </div>

        <div class="flex items-center justify-between">
          <select
            value={goal.status}
            onchange={(e) =>
              goalsStore.setStatus(goal, (e.currentTarget as HTMLSelectElement).value as GoalStatus)}
            aria-label="Goal status"
            class="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs"
          >
            {#each statuses as s (s)}
              <option value={s}>{GOAL_STATUS_LABELS[s]}</option>
            {/each}
          </select>
          {#if goal.targetDate}
            <span class="text-xs text-[var(--color-muted-foreground)]">
              Target: {new Date(goal.targetDate).toLocaleDateString()}
            </span>
          {/if}
        </div>
      </div>
    {:else}
      <p class="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
        No goals yet — add one above to start linking tasks to it.
      </p>
    {/each}
  </div>
</section>
