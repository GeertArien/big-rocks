<script lang="ts">
  import { Heart, Plus, Star, Trash2 } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { ConfirmDialog } from "@/lib/components/ui/confirm";
  import { EmptyState } from "@/lib/components/ui/state";
  import { cadenceLabel, peopleStore } from "@/lib/stores/people.svelte";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import type { CadenceUnit, CommitmentStatus, PersonOverview } from "@/lib/api";

  const loadingFirst = $derived(peopleStore.loading && peopleStore.people.length === 0);

  const AVATAR_COLORS = ["var(--terra)", "var(--pine)", "var(--gold)", "var(--plum)"];
  function avatarColor(name: string): string {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  }

  function worstStatus(person: PersonOverview): CommitmentStatus | null {
    if (person.commitments.length === 0) return null;
    if (person.commitments.some((c) => c.status === "OVERDUE")) return "OVERDUE";
    if (person.commitments.some((c) => c.status === "DUE_SOON")) return "DUE_SOON";
    return "ON_TRACK";
  }

  const STATUS_META: Record<CommitmentStatus, { label: string; cls: string }> = {
    ON_TRACK: { label: "on track", cls: "bg-[var(--pine-soft)] text-[var(--pine)]" },
    DUE_SOON: { label: "due soon", cls: "bg-[var(--gold-soft)] text-[var(--gold)]" },
    OVERDUE: { label: "overdue", cls: "bg-[var(--over,#a32d2d)] text-white" },
  };

  function relativeDays(iso: string | null): string {
    if (!iso) return "never logged";
    const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 14) return `${days} days ago`;
    return `${Math.round(days / 7)} weeks ago`;
  }

  let newName = $state("");
  let newRelationship = $state("");
  let deleteOpen = $state(false);
  let deletingPerson = $state<PersonOverview | null>(null);

  // Per-person add-commitment mini-form state.
  let addingFor = $state<string | null>(null);
  let cTitle = $state("");
  let cUnit = $state<CadenceUnit>("WEEK");
  let cValue = $state(1);

  async function addPerson() {
    const name = newName.trim();
    if (!name) return;
    await peopleStore.addPerson({ name, relationship: newRelationship.trim() || undefined });
    newName = "";
    newRelationship = "";
  }

  async function addCommitment(person: PersonOverview) {
    const title = cTitle.trim();
    if (!title) return;
    await peopleStore.addCommitment({
      title,
      cadenceUnit: cUnit,
      cadenceValue: cValue,
      personIds: [person.id],
    });
    addingFor = null;
    cTitle = "";
    cUnit = "WEEK";
    cValue = 1;
  }

  /** Habit 3 meets Habits 4–6: plan the commitment as a starred Q2 task. */
  function planAsRock(person: PersonOverview, title: string) {
    tasksStore
      .add({ title: `${title} — ${person.name}`, important: true })
      .then(() => {
        const created = tasksStore.tasks.find(
          (t) => t.title === `${title} — ${person.name}` && !t.isBigRock,
        );
        if (created) tasksStore.toggleBigRock(created);
      });
  }
</script>

<section class="flex flex-col gap-4">
  {#if peopleStore.error}
    <div
      class="flex items-center justify-between gap-2 rounded-md border border-[var(--terra)] bg-[var(--terra-soft)] px-3 py-2 text-sm text-[var(--terra)]"
    >
      <span>{peopleStore.error}</span>
      <Button variant="outline" size="sm" onclick={() => peopleStore.load()}>Retry</Button>
    </div>
  {/if}

  {#if loadingFirst}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each [0, 1] as i (i)}
        <div class="h-36 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"></div>
      {/each}
    </div>
  {:else if peopleStore.people.length === 0}
    <EmptyState
      icon={Heart}
      title="No one tracked yet"
      hint="Add the people who matter, then give each a recurring commitment — date night, the monthly one-on-one, the weekly call."
    />
  {:else}
    <div class="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
      {#each peopleStore.people as person (person.id)}
        {@const status = worstStatus(person)}
        <div
          class="flex flex-col rounded-xl border bg-[var(--color-card)] p-3.5 shadow-sm {status ===
          'OVERDUE'
            ? 'border-[var(--terra)]/40'
            : 'border-[var(--color-border)]'}"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold text-white"
              style={`background: ${avatarColor(person.name)}`}
            >
              {person.name.slice(0, 1).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-display text-[15px] font-semibold">{person.name}</p>
              {#if person.relationship}
                <p class="text-xs text-[var(--color-muted-foreground)]">{person.relationship}</p>
              {/if}
            </div>
            {#if status}
              <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold {STATUS_META[status].cls}">
                {STATUS_META[status].label}
              </span>
            {/if}
            <span
              class="rounded-full px-2.5 py-0.5 font-display text-[13px] font-semibold {person.balance >= 0
                ? 'bg-[var(--pine-soft)] text-[var(--pine)]'
                : 'bg-[var(--terra-soft)] text-[var(--terra)]'}"
              title="Emotional bank account balance"
            >
              {person.balance > 0 ? "+" : ""}{person.balance}
            </span>
            <button
              onclick={() => {
                deletingPerson = person;
                deleteOpen = true;
              }}
              aria-label="Remove person"
              class="flex size-6 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--destructive)]"
            >
              <Trash2 class="size-3.5" />
            </button>
          </div>

          {#each person.commitments as commitment (commitment.id)}
            <div class="mt-3 border-t border-dotted border-[var(--color-border)] pt-2.5">
              <div class="flex items-baseline gap-2">
                <span class="text-[13px] font-semibold">{commitment.title}</span>
                <span class="text-[11px] text-[var(--color-muted-foreground)]">
                  {cadenceLabel(commitment.cadenceUnit, commitment.cadenceValue)}
                </span>
                <button
                  onclick={() => peopleStore.removeCommitment(commitment.id)}
                  aria-label="Remove commitment"
                  class="ml-auto text-[var(--color-muted-foreground)] hover:text-[var(--destructive)]"
                >
                  <Trash2 class="size-3" />
                </button>
              </div>
              <div class="mt-2 flex items-center gap-1">
                {#each commitment.history as hit, i (i)}
                  <span
                    class="size-3.5 rounded-[4px] border {hit
                      ? 'border-[var(--pine)] bg-[var(--pine)]'
                      : 'border-[var(--color-border)] bg-[var(--terra-soft)]'}"
                  ></span>
                {/each}
                <span class="ml-auto text-[11px] text-[var(--color-muted-foreground)]">
                  last · {relativeDays(commitment.lastOccurredAt)}
                </span>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onclick={() => peopleStore.log(commitment.id, person.id)}
                >
                  Log occurrence
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => planAsRock(person, commitment.title)}
                >
                  <Star class="size-3" />
                  Plan as big rock
                </Button>
              </div>
            </div>
          {/each}

          {#if addingFor === person.id}
            <div class="mt-3 flex flex-col gap-2 border-t border-dotted border-[var(--color-border)] pt-2.5">
              <input
                bind:value={cTitle}
                placeholder="A commitment — date night, one-on-one…"
                onkeydown={(e) => e.key === "Enter" && addCommitment(person)}
                class="rounded-md border border-[var(--color-input)] bg-transparent px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none"
              />
              <div class="flex items-center gap-2">
                <span class="text-xs text-[var(--color-muted-foreground)]">every</span>
                <input
                  type="number"
                  bind:value={cValue}
                  min="1"
                  max="12"
                  class="w-14 rounded-md border border-[var(--color-input)] bg-transparent px-2 py-1 text-sm"
                />
                <select
                  bind:value={cUnit}
                  class="rounded-md border border-[var(--color-input)] bg-transparent px-2 py-1 text-sm"
                >
                  <option value="DAY">day(s)</option>
                  <option value="WEEK">week(s)</option>
                  <option value="MONTH">month(s)</option>
                </select>
                <div class="ml-auto flex gap-1.5">
                  <Button variant="outline" size="sm" onclick={() => (addingFor = null)}>Cancel</Button>
                  <Button size="sm" onclick={() => addCommitment(person)} disabled={!cTitle.trim()}>Add</Button>
                </div>
              </div>
            </div>
          {:else}
            <button
              onclick={() => {
                addingFor = person.id;
                cTitle = "";
              }}
              class="mt-3 self-start text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              ＋ commitment
            </button>
          {/if}

          <!-- Emotional bank account -->
          <details class="mt-2.5 border-t border-dotted border-[var(--color-border)] pt-2">
            <summary class="cursor-pointer text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              Bank account · {person.balance > 0 ? "+" : ""}{person.balance}
            </summary>
            <div class="mt-2 flex flex-col gap-1">
              {#each person.ledger as entry (entry.id)}
                <div class="flex gap-2 border-b border-dotted border-[var(--color-border)] pb-1 text-xs last:border-b-0">
                  <span class="w-5 font-bold {entry.kind === 'DEPOSIT' ? 'text-[var(--pine)]' : 'text-[var(--terra)]'}">
                    {entry.kind === "DEPOSIT" ? "+1" : "−1"}
                  </span>
                  <span class="flex-1 text-[var(--color-foreground)]/80">{entry.note ?? "(no note)"}</span>
                  <span class="text-[var(--color-muted-foreground)]">
                    {new Date(entry.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              {:else}
                <p class="font-display text-xs italic text-[var(--color-muted-foreground)]">No entries yet.</p>
              {/each}
              <div class="mt-1.5 flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => {
                    const note = prompt("What happened? (deposit)") ?? undefined;
                    if (note !== undefined) peopleStore.eba(person.id, "DEPOSIT", note || undefined);
                  }}
                >
                  + Deposit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => {
                    const note = prompt("What happened? (withdrawal)") ?? undefined;
                    if (note !== undefined) peopleStore.eba(person.id, "WITHDRAWAL", note || undefined);
                  }}
                >
                  − Withdrawal
                </Button>
              </div>
            </div>
          </details>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add a person -->
  <div class="flex flex-col gap-2 sm:flex-row">
    <input
      bind:value={newName}
      placeholder="Add a person who matters…"
      onkeydown={(e) => e.key === "Enter" && addPerson()}
      class="flex-1 rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none"
    />
    <input
      bind:value={newRelationship}
      placeholder="relationship (kid, spouse…)"
      onkeydown={(e) => e.key === "Enter" && addPerson()}
      class="rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none sm:w-48"
    />
    <Button size="sm" onclick={addPerson} disabled={!newName.trim()}>
      <Plus class="size-4" />
      Person
    </Button>
  </div>
</section>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Remove person?"
  description={deletingPerson
    ? `“${deletingPerson.name}” and their bank-account entries will be removed.`
    : ""}
  confirmLabel="Remove"
  destructive
  onConfirm={() => deletingPerson && peopleStore.removePerson(deletingPerson.id)}
/>
