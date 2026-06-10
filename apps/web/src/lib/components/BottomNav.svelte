<script lang="ts">
  import { NAV_ITEMS, navStore } from "@/lib/stores/nav.svelte";
</script>

<!-- Mobile-only fixed bottom navigation (thumb-reachable). -->
<nav
  class="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--color-border)] bg-[var(--color-card)] sm:hidden"
  style="padding-bottom: env(safe-area-inset-bottom)"
  aria-label="Primary"
>
  {#each NAV_ITEMS as item (item.id)}
    {@const Icon = item.icon}
    {@const active = navStore.current === item.id}
    <button
      onclick={() => navStore.go(item.id)}
      aria-current={active ? "page" : undefined}
      class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors {active
        ? 'text-[var(--color-primary)]'
        : 'text-[var(--color-muted-foreground)]'}"
    >
      <Icon class="size-5" />
      {item.short}
    </button>
  {/each}
</nav>
