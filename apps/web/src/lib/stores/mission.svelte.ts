import { getMission, setMission, type Mission } from "@/lib/api";

/** Reactive mission statement store (Habit 2). */
class MissionStore {
  mission = $state<Mission | null>(null);
  loading = $state(false);
  saving = $state(false);
  error = $state<string | null>(null);

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.mission = await getMission();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to load mission";
    } finally {
      this.loading = false;
    }
  }

  async save(content: string): Promise<void> {
    this.saving = true;
    this.error = null;
    try {
      this.mission = await setMission(content);
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to save mission";
    } finally {
      this.saving = false;
    }
  }
}

export const missionStore = new MissionStore();
