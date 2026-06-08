<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import NewTaskForm from "@/lib/components/NewTaskForm.svelte";
  import QuadrantBoard from "@/lib/components/QuadrantBoard.svelte";
  import BigRocksPanel from "@/lib/components/BigRocksPanel.svelte";
  import GoalsPanel from "@/lib/components/GoalsPanel.svelte";
  import MissionPanel from "@/lib/components/MissionPanel.svelte";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import { goalsStore } from "@/lib/stores/goals.svelte";
  import { missionStore } from "@/lib/stores/mission.svelte";
  import { getHealth } from "@/lib/api";
  import { getToken, setToken } from "@/lib/token";

  type Tab = "matrix" | "week" | "goals" | "mission";
  const tabs: { id: Tab; label: string }[] = [
    { id: "matrix", label: "Matrix" },
    { id: "week", label: "This Week" },
    { id: "goals", label: "Goals" },
    { id: "mission", label: "Mission" },
  ];

  let tab = $state<Tab>("matrix");
  let health = $state<"checking" | "ok" | "down">("checking");
  let showSettings = $state(false);
  let tokenInput = $state(getToken());

  function loadAll() {
    tasksStore.load();
    goalsStore.load();
    missionStore.load();
  }

  onMount(() => {
    getHealth()
      .then(() => (health = "ok"))
      .catch(() => (health = "down"));
    loadAll();
  });

  function saveToken() {
    setToken(tokenInput.trim());
    showSettings = false;
    loadAll();
  }

  function tabClass(active: boolean) {
    return active
      ? "border-[var(--color-primary)] text-[var(--color-foreground)]"
      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]";
  }
</script>

<main class="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
  <header class="flex items-start justify-between gap-2">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">BigRocks</h1>
      <p class="text-sm text-[var(--color-muted-foreground)]">
        Put the big rocks in first.
      </p>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onclick={() => (showSettings = !showSettings)}
      aria-label="API token settings"
    >
      ⚙︎
    </Button>
  </header>

  {#if showSettings}
    <div class="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm shadow-sm">
      <label for="token" class="text-xs font-medium text-[var(--color-muted-foreground)]">
        API token (only needed if the server sets API_AUTH_TOKEN)
      </label>
      <div class="flex gap-2">
        <Input id="token" bind:value={tokenInput} placeholder="paste bearer token" class="flex-1" />
        <Button size="sm" onclick={saveToken}>Save</Button>
      </div>
    </div>
  {/if}

  {#if tab === "matrix" || tab === "week"}
    <NewTaskForm />
  {/if}

  {#if tasksStore.error}
    <div class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {tasksStore.error}
      {#if tasksStore.error.includes("401")}
        — set your API token via ⚙︎.
      {/if}
    </div>
  {/if}

  <nav class="flex gap-4 overflow-x-auto border-b border-[var(--color-border)]">
    {#each tabs as t (t.id)}
      <button
        class="whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors {tabClass(
          tab === t.id,
        )}"
        onclick={() => (tab = t.id)}
      >
        {t.label}
      </button>
    {/each}
  </nav>

  {#if tab === "matrix"}
    <QuadrantBoard />
  {:else if tab === "week"}
    <BigRocksPanel />
  {:else if tab === "goals"}
    <GoalsPanel />
  {:else}
    <MissionPanel />
  {/if}

  <footer class="mt-auto pt-4 text-xs text-[var(--color-muted-foreground)]">
    Backend:
    <span
      class={health === "ok"
        ? "text-emerald-600"
        : health === "down"
          ? "text-red-600"
          : "text-amber-600"}
    >
      {health === "checking" ? "checking…" : health === "ok" ? "connected" : "unreachable"}
    </span>
  </footer>
</main>
