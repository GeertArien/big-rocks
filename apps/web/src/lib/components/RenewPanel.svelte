<script lang="ts">
  import { Plus, Trash2 } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import {
    DIMENSIONS,
    DIMENSION_META,
    cadenceText,
    renewalStore,
  } from "@/lib/stores/renewal.svelte";
  import { goalsStore } from "@/lib/stores/goals.svelte";
  import type { HabitView, RenewalDimension } from "@/lib/api";

  const loadingFirst = $derived(renewalStore.loading && renewalStore.habits.length === 0);

  function habitsOf(dimension: RenewalDimension | null): HabitView[] {
    return renewalStore.habits.filter((h) => h.dimension === dimension);
  }
  const untagged = $derived(habitsOf(null));

  // Per-dimension add-habit mini form.
  let addingFor = $state<RenewalDimension | "NONE" | null>(null);
  let hName = $state("");
  let hTarget = $state(7);
  let hGoalId = $state("");

  // One-off activity mini form.
  let loggingFor = $state<RenewalDimension | null>(null);
  let aTitle = $state("");

  // Weekly intention inline editor.
  let editingIntention = $state<RenewalDimension | null>(null);
  let iText = $state("");

  function saveIntention(dimension: RenewalDimension) {
    renewalStore.setIntention(dimension, iText);
    editingIntention = null;
  }

  async function addHabit(dimension: RenewalDimension | null) {
    const name = hName.trim();
    if (!name) return;
    await renewalStore.add({
      name,
      dimension: dimension ?? undefined,
      targetPerWeek: hTarget,
      goalId: hGoalId || undefined,
    });
    addingFor = null;
    hName = "";
    hTarget = 7;
    hGoalId = "";
  }

  async function logActivity(dimension: RenewalDimension) {
    const title = aTitle.trim();
    if (!title) return;
    await renewalStore.logActivity({ dimension, title });
    loggingFor = null;
    aTitle = "";
  }
</script>

{#snippet habitRow(habit: HabitView)}
  <div class="flex items-center gap-2.5 border-t border-dotted border-[var(--color-border)] py-2">
    <span class="min-w-0 flex-1 truncate text-[13.5px] font-medium">{habit.name}</span>
    <span class="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-foreground)]/70">
      {cadenceText(habit.targetPerWeek)}
    </span>
    {#if habit.goalTitle}
      <span class="hidden truncate text-[11px] text-[var(--color-muted-foreground)] sm:inline">
        ↳ {habit.goalTitle}
      </span>
    {/if}
    <span class="text-[11px] text-[var(--color-muted-foreground)]">
      {habit.doneThisWeek}/{habit.targetPerWeek} wk
    </span>
    <button
      onclick={() => renewalStore.remove(habit)}
      aria-label="Delete habit"
      class="text-[var(--color-muted-foreground)] hover:text-[var(--destructive)]"
    >
      <Trash2 class="size-3" />
    </button>
  </div>
{/snippet}

{#snippet addForm(dimension: RenewalDimension | null)}
  <div class="flex flex-col gap-2 border-t border-dotted border-[var(--color-border)] pt-2">
    <input
      bind:value={hName}
      placeholder="A recurring practice that renews you…"
      onkeydown={(e) => e.key === "Enter" && addHabit(dimension)}
      class="rounded-md border border-[var(--color-input)] bg-transparent px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none"
    />
    <div class="flex flex-wrap items-center gap-2">
      <select
        bind:value={hTarget}
        aria-label="Target per week"
        class="rounded-md border border-[var(--color-input)] bg-transparent px-2 py-1 text-xs"
      >
        <option value={7}>daily</option>
        {#each [1, 2, 3, 4, 5, 6] as n (n)}
          <option value={n}>{n}×/week</option>
        {/each}
      </select>
      {#if goalsStore.goals.length > 0}
        <select
          bind:value={hGoalId}
          aria-label="Link to goal"
          class="max-w-36 truncate rounded-md border border-[var(--color-input)] bg-transparent px-2 py-1 text-xs text-[var(--color-muted-foreground)]"
        >
          <option value="">— no goal —</option>
          {#each goalsStore.goals as goal (goal.id)}
            <option value={goal.id}>{goal.title}</option>
          {/each}
        </select>
      {/if}
      <div class="ml-auto flex gap-1.5">
        <Button variant="outline" size="sm" onclick={() => (addingFor = null)}>Cancel</Button>
        <Button size="sm" onclick={() => addHabit(dimension)} disabled={!hName.trim()}>Add</Button>
      </div>
    </div>
  </div>
{/snippet}

<section class="flex flex-col gap-4">
  {#if renewalStore.error}
    <div
      class="flex items-center justify-between gap-2 rounded-md border border-[var(--terra)] bg-[var(--terra-soft)] px-3 py-2 text-sm text-[var(--terra)]"
    >
      <span>{renewalStore.error}</span>
      <Button variant="outline" size="sm" onclick={() => renewalStore.load()}>Retry</Button>
    </div>
  {/if}

  {#if loadingFirst}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each [0, 1, 2, 3] as i (i)}
        <div class="h-32 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"></div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
      {#each DIMENSIONS as dimension (dimension)}
        {@const meta = DIMENSION_META[dimension]}
        {@const habits = habitsOf(dimension)}
        <div class="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 shadow-sm">
          <div class="flex items-center gap-2.5">
            <span class="size-3 rounded-full" style={`background: ${meta.color}`}></span>
            <div class="min-w-0 flex-1">
              <p class="font-display text-[15px] font-semibold">{meta.label}</p>
              <p class="text-[11px] text-[var(--color-muted-foreground)]">{meta.sub}</p>
            </div>
          </div>

          <div class="mt-2.5">
            {#each habits as habit (habit.id)}
              {@render habitRow(habit)}
            {:else}
              <p class="border-t border-dotted border-[var(--color-border)] py-2 font-display text-xs italic text-[var(--color-muted-foreground)]">
                No habits tagged here yet.
              </p>
            {/each}
          </div>

          <!-- This week's intention: intent, never scored. -->
          {#if editingIntention === dimension}
            <div class="flex gap-2 border-t border-dotted border-[var(--color-border)] pt-2">
              <input
                bind:value={iText}
                placeholder="How will you renew here this week?"
                onkeydown={(e) => e.key === "Enter" && saveIntention(dimension)}
                class="flex-1 rounded-md border border-[var(--color-input)] bg-transparent px-2.5 py-1.5 font-display text-sm italic focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none"
              />
              <Button size="sm" onclick={() => saveIntention(dimension)}>Save</Button>
            </div>
          {:else}
            <button
              onclick={() => {
                editingIntention = dimension;
                iText = renewalStore.intentions[dimension] ?? "";
              }}
              class="border-t border-dotted border-[var(--color-border)] pt-2 text-left font-display text-[12.5px] italic {renewalStore.intentions[dimension]
                ? 'text-[var(--color-muted-foreground)]'
                : 'text-[var(--color-input)]'} hover:text-[var(--color-foreground)]"
            >
              {renewalStore.intentions[dimension]
                ? `This week: ${renewalStore.intentions[dimension]}`
                : "Set this week's intention…"}
            </button>
          {/if}

          {#if addingFor === dimension}
            {@render addForm(dimension)}
          {:else if loggingFor === dimension}
            <div class="flex gap-2 border-t border-dotted border-[var(--color-border)] pt-2">
              <input
                bind:value={aTitle}
                placeholder="A one-off — a retreat, a long hike…"
                onkeydown={(e) => e.key === "Enter" && logActivity(dimension)}
                class="flex-1 rounded-md border border-[var(--color-input)] bg-transparent px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none"
              />
              <Button variant="outline" size="sm" onclick={() => (loggingFor = null)}>Cancel</Button>
              <Button size="sm" onclick={() => logActivity(dimension)} disabled={!aTitle.trim()}>Log</Button>
            </div>
          {:else}
            <div class="mt-1 flex gap-3">
              <button
                onclick={() => {
                  addingFor = dimension;
                  hName = "";
                }}
                class="text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                ＋ habit
              </button>
              <button
                onclick={() => {
                  loggingFor = dimension;
                  aTitle = "";
                }}
                class="text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                ＋ one-off
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if untagged.length > 0 || addingFor === "NONE"}
      <div class="rounded-xl border border-dashed border-[var(--color-input)] bg-[var(--color-secondary)]/40 p-3.5">
        <p class="font-display text-[14px] font-semibold">Untagged habits</p>
        <p class="text-[11px] text-[var(--color-muted-foreground)]">
          Fine as they are — they simply don't count toward a dimension.
        </p>
        <div class="mt-1">
          {#each untagged as habit (habit.id)}
            {@render habitRow(habit)}
          {/each}
        </div>
        {#if addingFor === "NONE"}
          {@render addForm(null)}
        {/if}
      </div>
    {/if}

    {#if addingFor !== "NONE"}
      <button
        onclick={() => {
          addingFor = "NONE";
          hName = "";
        }}
        class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-input)] py-2.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <Plus class="size-4" />
        Habit without a dimension
      </button>
    {/if}

    <p class="font-display text-xs italic text-[var(--color-muted-foreground)]">
      Habits are defined here; check them off in Clock · Today, and the Almanac keeps the record.
    </p>
  {/if}
</section>
