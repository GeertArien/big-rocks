<script lang="ts">
  import { Pencil, Plus, Target, Trash2 } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { EmptyState } from "@/lib/components/ui/state";
  import { ConfirmDialog } from "@/lib/components/ui/confirm";
  import GoalFormSheet from "./GoalFormSheet.svelte";
  import { GOAL_STATUS_LABELS, goalsStore } from "@/lib/stores/goals.svelte";
  import type { Goal, GoalStatus } from "@/lib/api";

  const statuses: GoalStatus[] = ["ACTIVE", "ON_HOLD", "ACHIEVED", "DROPPED"];
  const loadingFirst = $derived(goalsStore.loading && goalsStore.goals.length === 0);

  let formOpen = $state(false);
  let editingGoal = $state<Goal | null>(null);
  let deleteOpen = $state(false);
  let deletingGoal = $state<Goal | null>(null);

  function openCreate() {
    editingGoal = null;
    formOpen = true;
  }
  function openEdit(goal: Goal) {
    editingGoal = goal;
    formOpen = true;
  }
  function askDelete(goal: Goal) {
    deletingGoal = goal;
    deleteOpen = true;
  }

  function pct(ratio: number): number {
    return Math.round(ratio * 100);
  }
</script>

<section class="flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <p class="text-sm text-[var(--color-muted-foreground)]">
      Durable outcomes. Progress is derived from each goal's tasks.
    </p>
    <Button size="sm" onclick={openCreate}>
      <Plus class="size-4" />
      New goal
    </Button>
  </div>

  {#if goalsStore.error}
    <div
      class="flex items-center justify-between gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <span>{goalsStore.error}</span>
      <Button variant="outline" size="sm" onclick={() => goalsStore.load()}>Retry</Button>
    </div>
  {/if}

  {#if loadingFirst}
    <div class="flex flex-col gap-3">
      {#each [0, 1, 2] as i (i)}
        <div
          class="h-24 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
        ></div>
      {/each}
    </div>
  {:else if goalsStore.goals.length === 0}
    <EmptyState
      icon={Target}
      title="No goals yet"
      hint="Add a goal to start linking tasks to a bigger outcome (Habit 2)."
    >
      <Button size="sm" onclick={openCreate}>
        <Plus class="size-4" />
        New goal
      </Button>
    </EmptyState>
  {:else}
    <div class="flex flex-col gap-3">
      {#each goalsStore.goals as goal (goal.id)}
        <div
          class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <Target class="size-4 text-[var(--color-muted-foreground)]" />
              <h3 class="text-sm font-semibold">{goal.title}</h3>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button
                onclick={() => openEdit(goal)}
                aria-label="Edit goal"
                title="Edit"
                class="flex size-6 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
              >
                <Pencil class="size-3.5" />
              </button>
              <button
                onclick={() => askDelete(goal)}
                aria-label="Delete goal"
                title="Delete"
                class="flex size-6 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-red-600"
              >
                <Trash2 class="size-3.5" />
              </button>
            </div>
          </div>

          {#if goal.description}
            <p class="text-xs text-[var(--color-muted-foreground)]">{goal.description}</p>
          {/if}

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
      {/each}
    </div>
  {/if}
</section>

<GoalFormSheet bind:open={formOpen} goal={editingGoal} />
<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete goal?"
  description={deletingGoal
    ? `“${deletingGoal.title}” will be removed. Its tasks are kept but unlinked.`
    : ""}
  confirmLabel="Delete"
  destructive
  onConfirm={() => deletingGoal && goalsStore.remove(deletingGoal)}
/>
