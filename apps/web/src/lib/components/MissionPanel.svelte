<script lang="ts">
  import { Button } from "@/lib/components/ui/button";
  import { missionStore } from "@/lib/stores/mission.svelte";

  let draft = $state("");
  let initialized = $state(false);

  // Seed the editor from the loaded mission once.
  $effect(() => {
    if (!initialized && missionStore.mission) {
      draft = missionStore.mission.content;
      initialized = true;
    }
  });

  const dirty = $derived(draft.trim() !== (missionStore.mission?.content ?? "").trim());

  async function save() {
    if (!draft.trim()) return;
    await missionStore.save(draft.trim());
  }
</script>

<section class="flex flex-col gap-3">
  <div class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Personal mission statement</h2>
      {#if missionStore.mission}
        <span class="text-xs text-[var(--color-muted-foreground)]">
          Updated {new Date(missionStore.mission.updatedAt).toLocaleDateString()}
        </span>
      {/if}
    </div>
    <p class="text-xs text-[var(--color-muted-foreground)]">
      Begin with the end in mind. This sits at the top of your mission → goals →
      tasks hierarchy. Saving keeps previous versions as history.
    </p>

    <textarea
      bind:value={draft}
      rows="6"
      placeholder="What matters most? What do you want to be and do?"
      class="w-full resize-y rounded-md border border-[var(--color-border)] bg-transparent p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
    ></textarea>

    {#if missionStore.error}
      <p class="text-xs text-red-600">{missionStore.error}</p>
    {/if}

    <div class="flex items-center justify-end gap-2">
      <Button
        size="sm"
        onclick={save}
        disabled={!dirty || !draft.trim() || missionStore.saving}
      >
        {missionStore.saving ? "Saving…" : "Save"}
      </Button>
    </div>
  </div>
</section>
