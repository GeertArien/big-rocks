<script lang="ts">
  import { fly } from "svelte/transition";
  import { CheckCircle2, Info, XCircle, X } from "lucide-svelte";
  import { toast, type ToastKind } from "./toast.svelte";

  const icons = { success: CheckCircle2, error: XCircle, info: Info };

  function accent(kind: ToastKind): string {
    return kind === "success"
      ? "text-emerald-600"
      : kind === "error"
        ? "text-red-600"
        : "text-[var(--color-muted-foreground)]";
  }
</script>

<!-- Bottom-center on mobile (above the bottom nav), bottom-right on desktop. -->
<div
  class="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
  aria-live="polite"
  aria-atomic="false"
>
  {#each toast.items as t (t.id)}
    {@const Icon = icons[t.kind]}
    <div
      transition:fly={{ y: 16, duration: 200 }}
      class="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm shadow-lg"
      role="status"
    >
      <Icon class="mt-0.5 size-4 shrink-0 {accent(t.kind)}" />
      <span class="flex-1 leading-snug">{t.message}</span>
      <button
        onclick={() => toast.dismiss(t.id)}
        aria-label="Dismiss"
        class="rounded p-0.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
      >
        <X class="size-3.5" />
      </button>
    </div>
  {/each}
</div>
