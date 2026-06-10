<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { Button } from "@/lib/components/ui/button";

  type Props = {
    open: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  };

  let {
    open = $bindable(),
    title = "Are you sure?",
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    onConfirm,
  }: Props = $props();

  function cancel(): void {
    open = false;
  }

  function confirm(): void {
    open = false;
    onConfirm();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && open) cancel();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-[55] flex items-center justify-center p-4"
    role="alertdialog"
    aria-modal="true"
    aria-label={title}
  >
    <div
      class="absolute inset-0 bg-black/40"
      aria-hidden="true"
      onclick={cancel}
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      transition:scale={{ duration: 150, start: 0.96 }}
      class="relative z-10 flex w-full max-w-sm flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl"
    >
      <h2 class="text-base font-semibold">{title}</h2>
      {#if description}
        <p class="text-sm text-[var(--color-muted-foreground)]">{description}</p>
      {/if}
      <div class="mt-1 flex justify-end gap-2">
        <Button variant="outline" size="sm" onclick={cancel}>{cancelLabel}</Button>
        <Button
          size="sm"
          onclick={confirm}
          class={destructive
            ? "bg-red-600 text-white hover:bg-red-700 hover:opacity-100"
            : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
{/if}
