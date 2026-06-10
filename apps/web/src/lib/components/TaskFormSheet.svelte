<script lang="ts">
  import { Sheet } from "@/lib/components/ui/sheet";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import { goalsStore } from "@/lib/stores/goals.svelte";
  import type { Proactivity, Task } from "@/lib/api";

  type Props = { open: boolean; task?: Task | null };
  let { open = $bindable(), task = null }: Props = $props();

  let title = $state("");
  let notes = $state("");
  let important = $state(false);
  let urgent = $state(false);
  let proactivity = $state<Proactivity | "">("");
  let goalId = $state("");
  let dueDate = $state("");
  let submitting = $state(false);

  const editing = $derived(task !== null);

  // Re-seed the form whenever it opens (for create: blank; for edit: prefill).
  let lastOpen = $state(false);
  $effect(() => {
    if (open && !lastOpen) {
      title = task?.title ?? "";
      notes = task?.notes ?? "";
      important = task?.important ?? false;
      urgent = task?.urgent ?? false;
      proactivity = task?.proactivity ?? "";
      goalId = task?.goalId ?? "";
      dueDate = task?.dueDate ? task.dueDate.slice(0, 10) : "";
    }
    lastOpen = open;
  });

  function chip(active: boolean): string {
    return active
      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
      : "bg-transparent text-[var(--color-muted-foreground)] border-[var(--color-border)]";
  }

  async function submit(e: Event) {
    e.preventDefault();
    const t = title.trim();
    if (!t || submitting) return;
    submitting = true;
    const body = {
      title: t,
      notes: notes.trim() || null,
      important,
      urgent,
      proactivity: (proactivity || null) as Proactivity | null,
      goalId: goalId || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };
    if (task) {
      await tasksStore.update(task, body);
    } else {
      await tasksStore.add({
        title: t,
        notes: body.notes ?? undefined,
        important,
        urgent,
        proactivity: body.proactivity ?? undefined,
        goalId: body.goalId ?? undefined,
        dueDate: body.dueDate ?? undefined,
      });
    }
    submitting = false;
    open = false;
  }
</script>

<Sheet
  bind:open
  title={editing ? "Edit task" : "New task"}
  description="Quadrant is derived from importance × urgency."
>
  <form id="task-form" onsubmit={submit} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Title</span>
      <Input bind:value={title} placeholder="What needs doing?" required />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Notes</span>
      <textarea
        bind:value={notes}
        rows="3"
        placeholder="Optional details…"
        class="w-full resize-y rounded-md border border-[var(--color-border)] bg-transparent p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      ></textarea>
    </label>

    <div class="flex flex-col gap-1.5">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Priority</span>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={() => (important = !important)}
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {chip(important)}"
        >
          Important
        </button>
        <button
          type="button"
          onclick={() => (urgent = !urgent)}
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {chip(urgent)}"
        >
          Urgent
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">
        Proactivity (Habit 1)
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={() => (proactivity = proactivity === "INFLUENCE" ? "" : "INFLUENCE")}
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {chip(
            proactivity === 'INFLUENCE',
          )}"
        >
          Influence
        </button>
        <button
          type="button"
          onclick={() => (proactivity = proactivity === "CONCERN" ? "" : "CONCERN")}
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {chip(
            proactivity === 'CONCERN',
          )}"
        >
          Concern
        </button>
      </div>
    </div>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Goal (Habit 2)</span>
      <select
        bind:value={goalId}
        class="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-2 text-sm"
      >
        <option value="">No goal</option>
        {#each goalsStore.goals as goal (goal.id)}
          <option value={goal.id}>{goal.title}</option>
        {/each}
      </select>
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Due date</span>
      <Input type="date" bind:value={dueDate} />
    </label>
  </form>

  {#snippet footer()}
    <div class="flex justify-end gap-2">
      <Button variant="outline" size="sm" onclick={() => (open = false)}>Cancel</Button>
      <Button
        type="submit"
        form="task-form"
        size="sm"
        disabled={submitting || !title.trim()}
      >
        {editing ? "Save" : "Add task"}
      </Button>
    </div>
  {/snippet}
</Sheet>
