<script lang="ts">
  import { MODES, navStore } from "@/lib/stores/nav.svelte";
</script>

<!-- Desktop three-mode switch: Compass · Clock · Almanac. -->
<div
  class="hidden items-center gap-0.5 rounded-full border border-[var(--color-input)] bg-[var(--color-card)] p-0.5 sm:inline-flex"
  role="tablist"
  aria-label="Mode"
>
  {#each MODES as item (item.id)}
    {@const Icon = item.icon}
    {@const active = navStore.mode === item.id}
    <button
      onclick={() => navStore.go(item.id)}
      role="tab"
      aria-selected={active}
      class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors {active
        ? 'text-white'
        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}"
      style={active ? `background: ${item.accent}` : ""}
    >
      <Icon class="size-3.5" />
      {item.label}
    </button>
  {/each}
</div>
