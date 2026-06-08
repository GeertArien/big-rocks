<script lang="ts">
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { tasksStore } from "@/lib/stores/tasks.svelte";

  let title = $state("");
  let important = $state(true);
  let urgent = $state(false);
  let submitting = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    submitting = true;
    await tasksStore.add({ title: trimmed, important, urgent });
    title = "";
    submitting = false;
  }

  function chip(active: boolean) {
    return active
      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent"
      : "bg-transparent text-[var(--color-muted-foreground)] border-[var(--color-border)]";
  }
</script>

<form
  onsubmit={submit}
  class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm sm:flex-row sm:items-center"
>
  <Input
    bind:value={title}
    placeholder="Add a task…"
    aria-label="Task title"
    class="flex-1"
  />
  <div class="flex items-center gap-2">
    <button
      type="button"
      onclick={() => (important = !important)}
      aria-pressed={important}
      class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {chip(important)}"
    >
      Important
    </button>
    <button
      type="button"
      onclick={() => (urgent = !urgent)}
      aria-pressed={urgent}
      class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {chip(urgent)}"
    >
      Urgent
    </button>
    <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
      Add
    </Button>
  </div>
</form>
