import type { Prisma, Task } from "@prisma/client";
import { startOfIsoWeek } from "../domain/week.js";
import { deriveQuadrant, type Quadrant } from "../domain/quadrant.js";
import type { TaskRepository } from "../repositories/task-repository.js";

export interface CreateTaskInput {
  title: string;
  notes?: string;
  important?: boolean;
  urgent?: boolean;
  dueDate?: Date | null;
  goalId?: string | null;
}

/** A task plus its derived quadrant — the shape the API/UI consume. */
export type TaskWithQuadrant = Task & { quadrant: Quadrant };

function withQuadrant(task: Task): TaskWithQuadrant {
  return { ...task, quadrant: deriveQuadrant(task) };
}

/**
 * Business logic for tasks. Holds no ORM calls of its own — it depends only on
 * the TaskRepository interface, so it is trivially unit-testable with a fake.
 */
export class TaskService {
  constructor(private readonly tasks: TaskRepository) {}

  async create(input: CreateTaskInput): Promise<TaskWithQuadrant> {
    const data: Prisma.TaskCreateInput = {
      title: input.title,
      notes: input.notes,
      important: input.important ?? false,
      urgent: input.urgent ?? false,
      dueDate: input.dueDate ?? null,
      ...(input.goalId ? { goal: { connect: { id: input.goalId } } } : {}),
    };
    return withQuadrant(await this.tasks.create(data));
  }

  async get(id: string): Promise<TaskWithQuadrant | null> {
    const task = await this.tasks.findById(id);
    return task ? withQuadrant(task) : null;
  }

  async list(): Promise<TaskWithQuadrant[]> {
    return (await this.tasks.findMany()).map(withQuadrant);
  }

  /**
   * Habit 3: "what are my big rocks this week?" — Q2 tasks (important, not urgent)
   * planned into the given week (defaults to the current ISO week).
   */
  async bigRocksForWeek(reference: Date = new Date()): Promise<TaskWithQuadrant[]> {
    const weekStart = startOfIsoWeek(reference);
    const tasks = await this.tasks.findMany({
      important: true,
      urgent: false,
      plannedWeek: weekStart,
    });
    return tasks.map(withQuadrant);
  }

  async complete(id: string): Promise<TaskWithQuadrant> {
    return withQuadrant(
      await this.tasks.update(id, { status: "DONE", completedAt: new Date() }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.tasks.delete(id);
  }
}
