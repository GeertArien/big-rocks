<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "lucide-svelte";
  import { cn } from "@/lib/utils";

  type Props = {
    open: boolean;
    title?: string;
    description?: string;
    onClose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  };

  let {
    open = $bindable(),
    title,
    description,
    onClose,
    children,
    footer,
  }: Props = $props();

  function close(): void {
    open = false;
    onClose?.();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && open) close();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<div
  class={cn(
    "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
    open ? "opacity-100" : "pointer-events-none opacity-0",
  )}
  aria-hidden="true"
  onclick={close}
></div>

<!-- Panel: bottom sheet on mobile, right drawer on desktop. -->
<div
  class={cn(
    "fixed z-50 flex flex-col bg-[var(--color-card)] shadow-xl transition-transform duration-300 ease-out",
    "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl",
    "sm:inset-y-0 sm:right-0 sm:bottom-auto sm:left-auto sm:h-full sm:w-[26rem] sm:max-h-none sm:rounded-none",
    open
      ? "translate-y-0 sm:translate-x-0"
      : "translate-y-full sm:translate-y-0 sm:translate-x-full",
  )}
  role="dialog"
  aria-modal="true"
  aria-label={title}
  inert={open ? undefined : true}
>
  <header
    class="flex items-start justify-between gap-2 border-b border-[var(--color-border)] p-4"
  >
    <div class="flex flex-col gap-0.5">
      {#if title}<h2 class="text-base font-semibold">{title}</h2>{/if}
      {#if description}
        <p class="text-xs text-[var(--color-muted-foreground)]">{description}</p>
      {/if}
    </div>
    <button
      onclick={close}
      aria-label="Close"
      class="rounded-md p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
    >
      <X class="size-4" />
    </button>
  </header>

  <div class="flex-1 overflow-y-auto p-4">{@render children?.()}</div>

  {#if footer}
    <footer class="border-t border-[var(--color-border)] p-4">{@render footer()}</footer>
  {/if}
</div>
