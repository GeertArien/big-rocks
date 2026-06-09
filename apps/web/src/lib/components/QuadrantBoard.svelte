<script lang="ts">
  import { SlidersHorizontal } from "lucide-svelte";
  import TaskCard from "./TaskCard.svelte";
  import NewTaskForm from "./NewTaskForm.svelte";
  import { Button } from "@/lib/components/ui/button";
  import { QUADRANT_META, tasksStore } from "@/lib/stores/tasks.svelte";
  import { taskActions } from "@/lib/stores/task-actions.svelte";
  import type { Quadrant, Task } from "@/lib/api";

  // Only show active (not done) tasks on the matrix.
  const active = $derived(tasksStore.tasks.filter((t) => t.status !== "DONE"));
  const loadingFirst = $derived(tasksStore.loading && tasksStore.tasks.length === 0);

  function inQuadrant(q: Quadrant): Task[] {
    return active.filter((t) => t.quadrant === q);
  }

  const order: Quadrant[] = ["Q1", "Q2", "Q3", "Q4"];
</script>

<div class="flex flex-col gap-3">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
    <div class="flex-1"><NewTaskForm /></div>
    <Button variant="outline" size="sm" onclick={() => taskActions.create()}>
      <SlidersHorizontal class="size-3.5" />
      Details
    </Button>
  </div>

  {#if tasksStore.error}
    <div
      class="flex items-center justify-between gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <span>
        {tasksStore.error}{tasksStore.error.includes("401")
          ? " — set your API token in Settings."
          : ""}
      </span>
      <Button variant="outline" size="sm" onclick={() => tasksStore.load()}>Retry</Button>
    </div>
  {/if}

  {#if loadingFirst}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each order as q (q)}
        <div
          class="h-40 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
        ></div>
      {/each}
    </div>
  {:else}
    <section aria-label="Quadrant matrix" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each order as q (q)}
        {@const meta = QUADRANT_META[q]}
        {@const items = inQuadrant(q)}
        <div
          class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm"
          class:ring-1={q === "Q2"}
          class:ring-emerald-500={q === "Q2"}
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class={`size-2 rounded-full ${meta.dot}`}></span>
              <span class="text-xs font-medium text-[var(--color-muted-foreground)]">{q}</span>
              <h2 class="text-sm font-semibold">{meta.title}</h2>
            </div>
            <span class="text-xs text-[var(--color-muted-foreground)]">{items.length}</span>
          </div>
          <p class="-mt-1 text-xs text-[var(--color-muted-foreground)]">{meta.hint}</p>

          <div class="flex flex-col gap-2">
            {#each items as task (task.id)}
              <TaskCard {task} />
            {:else}
              <p class="py-2 text-center text-xs text-[var(--color-muted-foreground)]">
                Nothing here.
              </p>
            {/each}
          </div>
        </div>
      {/each}
    </section>
  {/if}
</div>
