<script lang="ts">
  import { Sheet } from "@/lib/components/ui/sheet";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { GOAL_STATUS_LABELS, goalsStore } from "@/lib/stores/goals.svelte";
  import { rolesStore } from "@/lib/stores/roles.svelte";
  import type { Goal, GoalStatus } from "@/lib/api";

  type Props = { open: boolean; goal?: Goal | null };
  let { open = $bindable(), goal = null }: Props = $props();

  const statuses: GoalStatus[] = ["ACTIVE", "ON_HOLD", "ACHIEVED", "DROPPED"];

  let title = $state("");
  let description = $state("");
  let status = $state<GoalStatus>("ACTIVE");
  let targetDate = $state("");
  let roleId = $state("");
  let submitting = $state(false);

  const editing = $derived(goal !== null);

  let lastOpen = $state(false);
  $effect(() => {
    if (open && !lastOpen) {
      title = goal?.title ?? "";
      description = goal?.description ?? "";
      status = goal?.status ?? "ACTIVE";
      targetDate = goal?.targetDate ? goal.targetDate.slice(0, 10) : "";
      roleId = goal?.roleId ?? "";
    }
    lastOpen = open;
  });

  async function submit(e: Event) {
    e.preventDefault();
    const t = title.trim();
    if (!t || submitting) return;
    submitting = true;
    const date = targetDate ? new Date(targetDate).toISOString() : null;
    if (goal) {
      await goalsStore.update(goal, {
        title: t,
        description: description.trim() || null,
        status,
        targetDate: date,
        roleId: roleId || null,
      });
    } else {
      await goalsStore.add({
        title: t,
        description: description.trim() || undefined,
        status,
        targetDate: date ?? undefined,
        roleId: roleId || undefined,
      });
    }
    submitting = false;
    open = false;
  }
</script>

<Sheet
  bind:open
  title={editing ? "Edit goal" : "New goal"}
  description="A durable outcome. Progress is derived from its tasks."
>
  <form id="goal-form" onsubmit={submit} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Title</span>
      <Input bind:value={title} placeholder="What outcome do you want?" required />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Description</span>
      <textarea
        bind:value={description}
        rows="3"
        placeholder="Optional context…"
        class="w-full resize-y rounded-md border border-[var(--color-border)] bg-transparent p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      ></textarea>
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Status</span>
      <select
        bind:value={status}
        class="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-2 text-sm"
      >
        {#each statuses as s (s)}
          <option value={s}>{GOAL_STATUS_LABELS[s]}</option>
        {/each}
      </select>
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Target date</span>
      <Input type="date" bind:value={targetDate} />
    </label>

    {#if rolesStore.roles.length > 0}
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-[var(--color-muted-foreground)]">Role</span>
        <select
          bind:value={roleId}
          class="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-2 text-sm"
        >
          <option value="">— no role —</option>
          {#each rolesStore.roles as role (role.id)}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
      </label>
    {/if}
  </form>

  {#snippet footer()}
    <div class="flex justify-end gap-2">
      <Button variant="outline" size="sm" onclick={() => (open = false)}>Cancel</Button>
      <Button type="submit" form="goal-form" size="sm" disabled={submitting || !title.trim()}>
        {editing ? "Save" : "Add goal"}
      </Button>
    </div>
  {/snippet}
</Sheet>
