<script lang="ts">
  import { SUBS, navStore } from "@/lib/stores/nav.svelte";

  const subs = $derived(SUBS[navStore.mode]);
</script>

<!-- Quiet underline tabs within the active mode; hidden when there's one screen. -->
{#if subs.length > 1}
  <nav
    class="-mb-px flex gap-0.5 overflow-x-auto border-b border-[var(--color-border)]"
    aria-label="Sections"
  >
    {#each subs as sub (sub.id)}
      {@const active = navStore.sub === sub.id}
      <button
        onclick={() => navStore.goSub(sub.id)}
        aria-current={active ? "page" : undefined}
        class="whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[0.8125rem] transition-colors {active
          ? 'font-semibold'
          : 'border-transparent font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}"
        style={active ? "color: var(--mode); border-color: var(--mode)" : ""}
      >
        {sub.label}
      </button>
    {/each}
  </nav>
{/if}
