import {
  createHabit,
  deleteHabit,
  getRenewalSummary,
  getRenewalTrends,
  listHabits,
  listRenewalActivities,
  logRenewalActivity,
  toggleHabit,
  type DimensionSummary,
  type HabitView,
  type RenewalActivity,
  type RenewalDimension,
  type RenewalTrends,
} from "@/lib/api";
import { toast } from "@/lib/components/ui/toast";

function message(err: unknown, fallback = "Something went wrong"): string {
  return err instanceof Error ? err.message : fallback;
}

/** Display metadata for the four fixed dimensions. */
export const DIMENSION_META: Record<
  RenewalDimension,
  { label: string; sub: string; color: string; soft: string }
> = {
  PHYSICAL: {
    label: "Physical",
    sub: "exercise · nutrition · rest",
    color: "var(--q1)",
    soft: "var(--terra-soft)",
  },
  MENTAL: {
    label: "Mental",
    sub: "reading · learning · planning",
    color: "var(--pine)",
    soft: "var(--pine-soft)",
  },
  SOCIAL_EMOTIONAL: {
    label: "Social / Emotional",
    sub: "connection · service · empathy",
    color: "var(--gold)",
    soft: "var(--gold-soft)",
  },
  SPIRITUAL: {
    label: "Spiritual",
    sub: "values · reflection · meaning",
    color: "var(--plum)",
    soft: "var(--plum-soft)",
  },
};

export const DIMENSIONS = Object.keys(DIMENSION_META) as RenewalDimension[];

/**
 * Habits + renewal (Habit 7). Habits are defined in Compass · Renew, checked
 * off in Clock · Today, and the Almanac reads the derived record.
 */
class RenewalStore {
  habits = $state<HabitView[]>([]);
  summary = $state<DimensionSummary[]>([]);
  trends = $state<RenewalTrends | null>(null);
  activities = $state<RenewalActivity[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      [this.habits, this.summary] = await Promise.all([listHabits(), getRenewalSummary()]);
    } catch (err) {
      this.error = message(err, "Failed to load habits");
    } finally {
      this.loading = false;
    }
  }

  /** The Almanac's read-only payload (loaded on demand). */
  async loadRecord(): Promise<void> {
    try {
      [this.trends, this.activities, this.summary, this.habits] = await Promise.all([
        getRenewalTrends(),
        listRenewalActivities(),
        getRenewalSummary(),
        listHabits(),
      ]);
    } catch (err) {
      this.error = message(err, "Failed to load the record");
    }
  }

  private async refreshSummary(): Promise<void> {
    try {
      this.summary = await getRenewalSummary();
    } catch {
      /* surfaced on next interaction */
    }
  }

  async add(body: {
    name: string;
    dimension?: RenewalDimension;
    goalId?: string;
    targetPerWeek?: number;
  }): Promise<void> {
    try {
      const created = await createHabit(body);
      this.habits = [...this.habits, created];
      toast.success("Habit added");
      this.refreshSummary();
    } catch (err) {
      toast.error(message(err));
    }
  }

  async remove(habit: HabitView): Promise<void> {
    const prev = this.habits;
    this.habits = prev.filter((h) => h.id !== habit.id);
    try {
      await deleteHabit(habit.id);
      toast.success("Habit deleted");
      this.refreshSummary();
    } catch (err) {
      this.habits = prev;
      toast.error(message(err));
    }
  }

  /** Optimistic today-toggle; the server returns the authoritative view. */
  async toggleToday(habit: HabitView): Promise<void> {
    const prev = this.habits;
    this.habits = this.habits.map((h) =>
      h.id === habit.id
        ? {
            ...h,
            markedToday: !h.markedToday,
            doneThisWeek: h.doneThisWeek + (h.markedToday ? -1 : 1),
          }
        : h,
    );
    try {
      const updated = await toggleHabit(habit.id);
      this.habits = this.habits.map((h) => (h.id === updated.id ? updated : h));
      this.refreshSummary();
    } catch (err) {
      this.habits = prev;
      toast.error(message(err));
    }
  }

  async logActivity(body: {
    dimension: RenewalDimension;
    title: string;
    note?: string;
  }): Promise<void> {
    try {
      await logRenewalActivity(body);
      toast.success("Renewal logged");
      this.refreshSummary();
    } catch (err) {
      toast.error(message(err));
    }
  }
}

export function cadenceText(targetPerWeek: number): string {
  return targetPerWeek >= 7 ? "daily" : `${targetPerWeek}×/wk`;
}

export const renewalStore = new RenewalStore();
