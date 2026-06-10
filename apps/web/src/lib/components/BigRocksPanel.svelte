<script lang="ts">
  import { Star } from "lucide-svelte";
  import TaskCard from "./TaskCard.svelte";
  import { Button } from "@/lib/components/ui/button";
  import { tasksStore } from "@/lib/stores/tasks.svelte";

  const loadingFirst = $derived(tasksStore.loading && tasksStore.tasks.length === 0);

  // This week's big rocks: pinned Q2 tasks that aren't done.
  const bigRocks = $derived(
    tasksStore.tasks.filter((t) => t.isBigRock && t.status !== "DONE"),
  );
  // Q2 tasks available to promote into the week.
  const candidates = $derived(
    tasksStore.tasks.filter(
      (t) => t.quadrant === "Q2" && !t.isBigRock && t.status !== "DONE",
    ),
  );
</script>

<section class="flex flex-col gap-4">
  {#if tasksStore.error}
    <div
      class="flex items-center justify-between gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <span>{tasksStore.error}</span>
      <Button variant="outline" size="sm" onclick={() => tasksStore.load()}>Retry</Button>
    </div>
  {/if}

  {#if loadingFirst}
    <div class="h-32 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"></div>
  {/if}

  <div class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm">
    <div class="flex items-center gap-2">
      <Star class="size-4 text-[var(--star)]" fill="currentColor" />
      <h2 class="text-sm font-semibold">This week's big rocks</h2>
      <span class="text-xs text-[var(--color-muted-foreground)]">{bigRocks.length}</span>
    </div>
    <p class="-mt-1 text-xs text-[var(--color-muted-foreground)]">
      Put these in first. Pin important-but-not-urgent (Q2) tasks to plan your week.
    </p>
    <div class="flex flex-col gap-2">
      {#each bigRocks as task (task.id)}
        <TaskCard {task} />
      {:else}
        <p class="py-2 text-center text-xs text-[var(--color-muted-foreground)]">
          No big rocks pinned yet — pick from your Q2 tasks below.
        </p>
      {/each}
    </div>
  </div>

  {#if candidates.length > 0}
    <div class="flex flex-col gap-2 rounded-lg border border-dashed border-[var(--color-border)] p-3">
      <h3 class="text-xs font-medium text-[var(--color-muted-foreground)]">
        Q2 candidates (tap the star to pin)
      </h3>
      <div class="flex flex-col gap-2">
        {#each candidates as task (task.id)}
          <TaskCard {task} />
        {/each}
      </div>
    </div>
  {/if}
</section>
