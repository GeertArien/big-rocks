<script lang="ts">
  import type { ComponentType, Snippet } from "svelte";

  type Props = {
    icon?: ComponentType;
    title: string;
    hint?: string;
    children?: Snippet;
  };
  let { icon, title, hint, children }: Props = $props();
</script>

<div
  class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-10 text-center"
>
  {#if icon}
    {@const Icon = icon}
    <Icon class="size-6 text-[var(--color-muted-foreground)]" />
  {/if}
  <p class="text-sm font-medium">{title}</p>
  {#if hint}
    <p class="max-w-xs text-xs text-[var(--color-muted-foreground)]">{hint}</p>
  {/if}
  {#if children}
    <div class="mt-1">{@render children()}</div>
  {/if}
</div>
