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

/** Reactive goals store (Habit 2). Mutations refresh from the server. */
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
      this.error = err instanceof Error ? err.message : "Failed to load goals";
    } finally {
      this.loading = false;
    }
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.error = null;
    try {
      await action();
      this.goals = await listGoals();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Request failed";
    }
  }

  add(body: CreateGoalBody): Promise<void> {
    return this.run(() => createGoal(body));
  }

  update(id: string, body: UpdateGoalBody): Promise<void> {
    return this.run(() => updateGoal(id, body));
  }

  setStatus(goal: Goal, status: GoalStatus): Promise<void> {
    return this.run(() => updateGoal(goal.id, { status }));
  }

  remove(goal: Goal): Promise<void> {
    return this.run(() => deleteGoal(goal.id));
  }
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  ACHIEVED: "Achieved",
  DROPPED: "Dropped",
};

export const goalsStore = new GoalsStore();
