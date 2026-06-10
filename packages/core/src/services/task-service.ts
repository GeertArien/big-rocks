import type { Prisma, ProactivityTag, Task, TaskStatus } from "@prisma/client";
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
  projectId?: string | null;
  proactivity?: ProactivityTag | null;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  important?: boolean;
  urgent?: boolean;
  dueDate?: Date | null;
  goalId?: string | null;
  projectId?: string | null;
  isBigRock?: boolean;
  plannedWeek?: Date | null;
  proactivity?: ProactivityTag | null;
}

/** Filters for listing tasks. */
export interface TaskFilter {
  status?: TaskStatus;
  /** A specific goal's tasks, or `null` for tasks not linked to any goal. */
  goalId?: string | null;
  /** A specific project's tasks, or `null` for the Inbox (no project). */
  projectId?: string | null;
  proactivity?: ProactivityTag;
}

/** A task plus its derived quadrant — the shape the API/UI consume. */
export type TaskWithQuadrant = Task & { quadrant: Quadrant };

function withQuadrant(task: Task): TaskWithQuadrant {
  return { ...task, quadrant: deriveQuadrant(task) };
}

/** Group a list of tasks by their derived quadrant (handy for the matrix UI). */
export function groupByQuadrant(
  tasks: TaskWithQuadrant[],
): Record<Quadrant, TaskWithQuadrant[]> {
  const groups: Record<Quadrant, TaskWithQuadrant[]> = {
    Q1: [],
    Q2: [],
    Q3: [],
    Q4: [],
  };
  for (const task of tasks) groups[task.quadrant].push(task);
  return groups;
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
      proactivity: input.proactivity ?? null,
      ...(input.goalId ? { goal: { connect: { id: input.goalId } } } : {}),
      ...(input.projectId ? { project: { connect: { id: input.projectId } } } : {}),
    };
    return withQuadrant(await this.tasks.create(data));
  }

  async get(id: string): Promise<TaskWithQuadrant | null> {
    const task = await this.tasks.findById(id);
    return task ? withQuadrant(task) : null;
  }

  /** List tasks with optional filters (status, goal, influence/concern). */
  async list(filter: TaskFilter = {}): Promise<TaskWithQuadrant[]> {
    const where: Prisma.TaskWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.goalId !== undefined) where.goalId = filter.goalId;
    if (filter.projectId !== undefined) where.projectId = filter.projectId;
    if (filter.proactivity) where.proactivity = filter.proactivity;
    return (await this.tasks.findMany(where)).map(withQuadrant);
  }

  /**
   * Partial update. Importance/urgency edits move a task between quadrants
   * (the quadrant itself is never stored — it is always re-derived).
   */
  async update(id: string, input: UpdateTaskInput): Promise<TaskWithQuadrant> {
    const data: Prisma.TaskUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.important !== undefined) data.important = input.important;
    if (input.urgent !== undefined) data.urgent = input.urgent;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.isBigRock !== undefined) data.isBigRock = input.isBigRock;
    if (input.plannedWeek !== undefined) data.plannedWeek = input.plannedWeek;
    if (input.proactivity !== undefined) data.proactivity = input.proactivity;
    if (input.goalId !== undefined) {
      data.goal = input.goalId
        ? { connect: { id: input.goalId } }
        : { disconnect: true };
    }
    if (input.projectId !== undefined) {
      data.project = input.projectId
        ? { connect: { id: input.projectId } }
        : { disconnect: true };
    }
    return withQuadrant(await this.tasks.update(id, data));
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

  /**
   * Mark (or unmark) a task as a big rock for a given week. Marking pins it to
   * that ISO week's Monday; unmarking clears the planned week.
   */
  async setBigRock(
    id: string,
    isBigRock: boolean,
    reference: Date = new Date(),
  ): Promise<TaskWithQuadrant> {
    return this.update(id, {
      isBigRock,
      plannedWeek: isBigRock ? startOfIsoWeek(reference) : null,
    });
  }

  async complete(id: string): Promise<TaskWithQuadrant> {
    return withQuadrant(
      await this.tasks.update(id, { status: "DONE", completedAt: new Date() }),
    );
  }

  /** Reopen a completed task. */
  async reopen(id: string): Promise<TaskWithQuadrant> {
    return withQuadrant(
      await this.tasks.update(id, { status: "TODO", completedAt: null }),
    );
  }

  async remove(id: string): Promise<void> {
    await this.tasks.delete(id);
  }
}
