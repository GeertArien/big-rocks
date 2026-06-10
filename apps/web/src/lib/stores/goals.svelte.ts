import {
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
  type CreateGoalBody,
  type Goal,
  type GoalStatus,
  type UpdateGoalBody,
} from "@/lib/api";
import { toast } from "@/lib/components/ui/toast";

function message(err: unknown, fallback = "Something went wrong"): string {
  return err instanceof Error ? err.message : fallback;
}

/** Reactive goals store (Habit 2) with optimistic updates + toast feedback. */
class GoalsStore {
  goals = $state<Goal[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.goals = await listGoals();
    } catch (err) {
      this.error = message(err, "Failed to load goals");
    } finally {
      this.loading = false;
    }
  }

  /** Silent reload (no loading flicker) — used when task changes shift progress. */
  async refresh(): Promise<void> {
    try {
      this.goals = await listGoals();
    } catch {
      /* keep current state; a later interaction will surface errors */
    }
  }

  async add(body: CreateGoalBody): Promise<void> {
    const now = new Date().toISOString();
    const temp: Goal = {
      id: `temp_${now}`,
      title: body.title,
      description: body.description ?? null,
      targetDate: body.targetDate ?? null,
      status: body.status ?? "ACTIVE",
      roleId: body.roleId ?? null,
      dimension: null,
      progress: { total: 0, done: 0, ratio: 0 },
      createdAt: now,
      updatedAt: now,
    };
    const prev = this.goals;
    this.goals = [temp, ...prev];
    try {
      const created = await createGoal(body);
      this.goals = this.goals.map((g) => (g.id === temp.id ? created : g));
      toast.success("Goal added");
    } catch (err) {
      this.goals = prev;
      toast.error(message(err));
    }
  }

  private async edit(
    id: string,
    optimistic: Partial<Goal>,
    body: UpdateGoalBody,
  ): Promise<void> {
    const prev = this.goals;
    this.goals = this.goals.map((g) => (g.id === id ? { ...g, ...optimistic } : g));
    try {
      const updated = await updateGoal(id, body);
      this.goals = this.goals.map((g) => (g.id === updated.id ? updated : g));
    } catch (err) {
      this.goals = prev;
      toast.error(message(err));
    }
  }

  update(goal: Goal, body: UpdateGoalBody): Promise<void> {
    return this.edit(goal.id, body as Partial<Goal>, body);
  }

  setStatus(goal: Goal, status: GoalStatus): Promise<void> {
    return this.edit(goal.id, { status }, { status });
  }

  async remove(goal: Goal): Promise<void> {
    const prev = this.goals;
    this.goals = prev.filter((g) => g.id !== goal.id);
    try {
      await deleteGoal(goal.id);
      toast.success("Goal deleted");
    } catch (err) {
      this.goals = prev;
      toast.error(message(err));
    }
  }
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  ACHIEVED: "Achieved",
  DROPPED: "Dropped",
};

export const goalsStore = new GoalsStore();
