import type { Task } from "@/lib/api";

/**
 * Shared UI state for editing/deleting a task. Task cards live in multiple
 * panels (Matrix, Week), so a single edit sheet + confirm dialog are mounted at
 * the app shell and driven through this store rather than one per card.
 */
class TaskActions {
  editing = $state<Task | null>(null);
  editOpen = $state(false);

  deleting = $state<Task | null>(null);
  deleteOpen = $state(false);

  /** Open the form sheet to edit an existing task, or create one with `null`. */
  edit(task: Task | null): void {
    this.editing = task;
    this.editOpen = true;
  }

  create(): void {
    this.edit(null);
  }

  askDelete(task: Task): void {
    this.deleting = task;
    this.deleteOpen = true;
  }
}

export const taskActions = new TaskActions();
