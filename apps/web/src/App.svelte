<script lang="ts">
  import { onMount } from "svelte";
  import { Settings } from "lucide-svelte";
  import QuadrantBoard from "@/lib/components/QuadrantBoard.svelte";
  import WeekPanel from "@/lib/components/WeekPanel.svelte";
  import ProjectsPanel from "@/lib/components/ProjectsPanel.svelte";
  import PeoplePanel from "@/lib/components/PeoplePanel.svelte";
  import RenewPanel from "@/lib/components/RenewPanel.svelte";
  import TodayPanel from "@/lib/components/TodayPanel.svelte";
  import AlmanacPanel from "@/lib/components/AlmanacPanel.svelte";
  import GoalsPanel from "@/lib/components/GoalsPanel.svelte";
  import MissionPanel from "@/lib/components/MissionPanel.svelte";
  import ModeSwitch from "@/lib/components/ModeSwitch.svelte";
  import SubTabs from "@/lib/components/SubTabs.svelte";
  import BottomNav from "@/lib/components/BottomNav.svelte";
  import SettingsSheet from "@/lib/components/SettingsSheet.svelte";
  import TaskFormSheet from "@/lib/components/TaskFormSheet.svelte";
  import { Toaster } from "@/lib/components/ui/toast";
  import { ConfirmDialog } from "@/lib/components/ui/confirm";
  import { tasksStore } from "@/lib/stores/tasks.svelte";
  import { goalsStore } from "@/lib/stores/goals.svelte";
  import { rolesStore } from "@/lib/stores/roles.svelte";
  import { projectsStore } from "@/lib/stores/projects.svelte";
  import { peopleStore } from "@/lib/stores/people.svelte";
  import { renewalStore } from "@/lib/stores/renewal.svelte";
  import { missionStore } from "@/lib/stores/mission.svelte";
  import { taskActions } from "@/lib/stores/task-actions.svelte";
  import { navStore } from "@/lib/stores/nav.svelte";
  import { getHealth } from "@/lib/api";

  let health = $state<"checking" | "ok" | "down">("checking");
  let settingsOpen = $state(false);

  function loadAll() {
    getHealth()
      .then(() => (health = "ok"))
      .catch(() => (health = "down"));
    tasksStore.load();
    goalsStore.load();
    rolesStore.load();
    projectsStore.load();
    peopleStore.load();
    renewalStore.load();
    missionStore.load();
  }

  onMount(loadAll);
</script>

<!-- The active mode's accent flows through kickers, tabs, and highlights. -->
<div class="flex min-h-dvh flex-col" style={`--mode: ${navStore.modeItem.accent}`}>
  <header
    class="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-card)]/85 backdrop-blur"
  >
    <div class="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm text-[var(--color-primary-foreground)]"
        >
          ▲
        </div>
        <h1 class="font-display text-lg font-semibold tracking-tight">BigRocks</h1>
      </div>

      <div class="flex flex-1 justify-center">
        <ModeSwitch />
      </div>

      <button
        onclick={() => (settingsOpen = true)}
        aria-label="Settings"
        title="Settings"
        class="flex size-9 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
      >
        <Settings class="size-5" />
      </button>
    </div>
  </header>

  <main class="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-24 sm:pb-10">
    <!-- Page header: mode kicker + serif title for the active screen. -->
    <p
      class="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style="color: var(--mode)"
    >
      {navStore.modeItem.label}
    </p>
    <h2 class="mt-1 font-display text-2xl font-semibold tracking-tight">
      {navStore.subItem.title}
    </h2>
    <p class="mt-1 mb-4 text-[13px] text-[var(--color-muted-foreground)]">
      {navStore.subItem.subtitle}
    </p>

    <div class="mb-6">
      <SubTabs />
    </div>

    {#if navStore.mode === "compass"}
      {#if navStore.sub === "matrix"}
        <QuadrantBoard />
      {:else if navStore.sub === "projects"}
        <ProjectsPanel />
      {:else if navStore.sub === "people"}
        <PeoplePanel />
      {:else if navStore.sub === "renew"}
        <RenewPanel />
      {:else}
        <div class="flex flex-col gap-6">
          <MissionPanel />
          <GoalsPanel />
        </div>
      {/if}
    {:else if navStore.mode === "clock"}
      {#if navStore.sub === "week"}
        <WeekPanel />
      {:else}
        <TodayPanel />
      {/if}
    {:else}
      <AlmanacPanel />
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
