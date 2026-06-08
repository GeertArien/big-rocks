<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@/lib/components/ui/button";
  import { getHealth } from "@/lib/api";

  const quadrants = [
    { id: "Q1", title: "Urgent & Important", hint: "Do now", accent: "bg-red-500" },
    {
      id: "Q2",
      title: "Important, Not Urgent",
      hint: "Big rocks — plan first",
      accent: "bg-emerald-500",
    },
    {
      id: "Q3",
      title: "Urgent, Not Important",
      hint: "Delegate / minimize",
      accent: "bg-amber-500",
    },
    {
      id: "Q4",
      title: "Not Urgent, Not Important",
      hint: "Eliminate",
      accent: "bg-slate-400",
    },
  ];

  let health = $state<"checking" | "ok" | "down">("checking");

  onMount(() => {
    getHealth()
      .then(() => (health = "ok"))
      .catch(() => (health = "down"));
  });
</script>

<main class="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
  <header class="flex flex-col gap-1">
    <h1 class="text-2xl font-semibold tracking-tight">BigRocks</h1>
    <p class="text-sm text-[var(--color-muted-foreground)]">
      Put the big rocks in first. (Scaffold — the matrix becomes interactive in
      build step 2.)
    </p>
  </header>

  <section
    aria-label="Quadrant matrix"
    class="grid grid-cols-1 gap-3 sm:grid-cols-2"
  >
    {#each quadrants as q (q.id)}
      <div
        class="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <span class={`size-2 rounded-full ${q.accent}`}></span>
          <span class="text-xs font-medium text-[var(--color-muted-foreground)]">
            {q.id}
          </span>
        </div>
        <h2 class="mt-1 text-sm font-semibold">{q.title}</h2>
        <p class="text-xs text-[var(--color-muted-foreground)]">{q.hint}</p>
      </div>
    {/each}
  </section>

  <footer class="flex items-center justify-between">
    <span class="text-xs text-[var(--color-muted-foreground)]">
      Backend:
      <span
        class={health === "ok"
          ? "text-emerald-600"
          : health === "down"
            ? "text-red-600"
            : "text-amber-600"}
      >
        {health === "checking"
          ? "checking…"
          : health === "ok"
            ? "connected"
            : "unreachable"}
      </span>
    </span>
    <Button size="sm" variant="outline" onclick={() => location.reload()}>
      Refresh
    </Button>
  </footer>
</main>
