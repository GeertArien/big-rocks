import {
  completeTask,
  createTask,
  deleteTask,
  listTasks,
  reopenTask,
  updateTask,
  type CreateTaskBody,
  type Quadrant,
  type Task,
} from "@/lib/api";
import { startOfIsoWeekIso } from "@/lib/week";

/**
 * Reactive task store. Mutations call the API and then refresh from the server
 * (simple and correct for a single-user app; optimistic updates can come later).
 */
class TasksStore {
  tasks = $state<Task[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.tasks = await listTasks();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to load tasks";
    } finally {
      this.loading = false;
    }
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.error = null;
    try {
      await action();
      this.tasks = await listTasks();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Request failed";
    }
  }

  add(body: CreateTaskBody): Promise<void> {
    return this.run(() => createTask(body));
  }

  /** Move a task between quadrants by toggling importance/urgency. */
  setFlags(task: Task, flags: { important?: boolean; urgent?: boolean }): Promise<void> {
    return this.run(() => updateTask(task.id, flags));
  }

  toggleComplete(task: Task): Promise<void> {
    return this.run(() =>
      task.status === "DONE" ? reopenTask(task.id) : completeTask(task.id),
    );
  }

  toggleBigRock(task: Task): Promise<void> {
    const next = !task.isBigRock;
    return this.run(() =>
      updateTask(task.id, {
        isBigRock: next,
        plannedWeek: next ? startOfIsoWeekIso() : null,
      }),
    );
  }

  remove(task: Task): Promise<void> {
    return this.run(() => deleteTask(task.id));
  }
}

export const QUADRANT_META: Record<
  Quadrant,
  { title: string; hint: string; dot: string }
> = {
  Q1: { title: "Urgent & Important", hint: "Do now", dot: "bg-red-500" },
  Q2: {
    title: "Important, Not Urgent",
    hint: "Big rocks — plan first",
    dot: "bg-emerald-500",
  },
  Q3: {
    title: "Urgent, Not Important",
    hint: "Delegate / minimize",
    dot: "bg-amber-500",
  },
  Q4: {
    title: "Not Urgent, Not Important",
    hint: "Eliminate",
    dot: "bg-slate-400",
  },
};

export const tasksStore = new TasksStore();
