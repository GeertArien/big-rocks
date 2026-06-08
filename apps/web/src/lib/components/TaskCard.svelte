<script lang="ts">
  import { Check, RotateCcw, Star, Trash2 } from "lucide-svelte";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import type { Task } from "@/lib/api";

  let { task }: { task: Task } = $props();

  const done = $derived(task.status === "DONE");

  function toggleChip(active: boolean) {
    return active
      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
      : "bg-transparent text-[var(--color-muted-foreground)] border-[var(--color-border)]";
  }
</script>

<div
  class="flex items-start gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-2.5"
  class:opacity-60={done}
>
  <button
    onclick={() => tasksStore.toggleComplete(task)}
    aria-label={done ? "Reopen task" : "Complete task"}
    title={done ? "Reopen" : "Complete"}
    class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
  >
    {#if done}
      <RotateCcw class="size-3" />
    {:else}
      <Check class="size-3 opacity-0 hover:opacity-100" />
    {/if}
  </button>

  <div class="min-w-0 flex-1">
    <p class="text-sm leading-snug" class:line-through={done}>{task.title}</p>
    <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
      <button
        onclick={() => tasksStore.setFlags(task, { important: !task.important })}
        aria-pressed={task.important}
        class="rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors {toggleChip(
          task.important,
        )}"
      >
        Important
      </button>
      <button
        onclick={() => tasksStore.setFlags(task, { urgent: !task.urgent })}
        aria-pressed={task.urgent}
        class="rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors {toggleChip(
          task.urgent,
        )}"
      >
        Urgent
      </button>
    </div>
  </div>

  <div class="flex shrink-0 items-center gap-1">
    {#if task.quadrant === "Q2"}
      <button
        onclick={() => tasksStore.toggleBigRock(task)}
        aria-label={task.isBigRock ? "Unpin big rock" : "Pin as this week's big rock"}
        title={task.isBigRock ? "Unpin big rock" : "Pin as big rock"}
        class="flex size-6 items-center justify-center rounded hover:bg-[var(--color-accent)]"
        class:text-amber-500={task.isBigRock}
        class:text-[var(--color-muted-foreground)]={!task.isBigRock}
      >
        <Star class="size-3.5" fill={task.isBigRock ? "currentColor" : "none"} />
      </button>
    {/if}
    <button
      onclick={() => tasksStore.remove(task)}
      aria-label="Delete task"
      title="Delete"
      class="flex size-6 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-red-600"
    >
      <Trash2 class="size-3.5" />
    </button>
  </div>
</div>
