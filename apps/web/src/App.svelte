<script lang="ts">
  import { onMount } from "svelte";
  import { Settings } from "lucide-svelte";
  import QuadrantBoard from "@/lib/components/QuadrantBoard.svelte";
  import BigRocksPanel from "@/lib/components/BigRocksPanel.svelte";
  import GoalsPanel from "@/lib/components/GoalsPanel.svelte";
  import MissionPanel from "@/lib/components/MissionPanel.svelte";
  import BottomNav from "@/lib/components/BottomNav.svelte";
  import SettingsSheet from "@/lib/components/SettingsSheet.svelte";
  import TaskFormSheet from "@/lib/components/TaskFormSheet.svelte";
  import { Toaster } from "@/lib/components/ui/toast";
  import { ConfirmDialog } from "@/lib/components/ui/confirm";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import { goalsStore } from "@/lib/stores/goals.svelte";
  import { missionStore } from "@/lib/stores/mission.svelte";
  import { taskActions } from "@/lib/stores/task-actions.svelte";
  import { NAV_ITEMS, navStore } from "@/lib/stores/nav.svelte";
  import { getHealth } from "@/lib/api";

  let health = $state<"checking" | "ok" | "down">("checking");
  let settingsOpen = $state(false);

  const currentLabel = $derived(
    NAV_ITEMS.find((i) => i.id === navStore.current)?.label ?? "",
  );

  function loadAll() {
    getHealth()
      .then(() => (health = "ok"))
      .catch(() => (health = "down"));
    tasksStore.load();
    goalsStore.load();
    missionStore.load();
  }

  onMount(loadAll);
</script>

<div class="flex min-h-dvh flex-col">
  <!-- Top bar: brand + (desktop) horizontal nav + settings. -->
  <header
    class="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur"
  >
    <div class="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
      <h1 class="text-lg font-semibold tracking-tight">BigRocks</h1>

      <nav class="hidden flex-1 items-center gap-1 sm:flex" aria-label="Primary">
        {#each NAV_ITEMS as item (item.id)}
          {@const Icon = item.icon}
          {@const active = navStore.current === item.id}
          <button
            onclick={() => navStore.go(item.id)}
            aria-current={active ? "page" : undefined}
            class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {active
              ? 'bg-[var(--color-accent)] text-[var(--color-foreground)]'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}"
          >
            <Icon class="size-4" />
            {item.label}
          </button>
        {/each}
      </nav>

      <button
        onclick={() => (settingsOpen = true)}
        aria-label="Settings"
        title="Settings"
        class="ml-auto flex size-9 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] sm:ml-0"
      >
        <Settings class="size-5" />
      </button>
    </div>
  </header>

  <!-- Section heading (mobile shows the active section name). -->
  <main class="mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-24 sm:pb-8">
    <h2 class="mb-4 text-xl font-semibold tracking-tight sm:hidden">{currentLabel}</h2>

    {#if navStore.current === "matrix"}
      <QuadrantBoard />
    {:else if navStore.current === "week"}
      <BigRocksPanel />
    {:else if navStore.current === "goals"}
      <GoalsPanel />
    {:else}
      <MissionPanel />
    {/if}
  </main>

  <BottomNav />
</div>

<Toaster />
<SettingsSheet bind:open={settingsOpen} {health} onSaved={loadAll} />
<TaskFormSheet bind:open={taskActions.editOpen} task={taskActions.editing} />
<ConfirmDialog
  bind:open={taskActions.deleteOpen}
  title="Delete task?"
  description={taskActions.deleting ? `“${taskActions.deleting.title}” will be removed.` : ""}
  confirmLabel="Delete"
  destructive
  onConfirm={() => taskActions.deleting && tasksStore.remove(taskActions.deleting)}
/>
