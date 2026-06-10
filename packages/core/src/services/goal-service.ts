import type { Goal, GoalStatus, Prisma } from "@prisma/client";
import type {
  GoalRepository,
  GoalWithTasks,
} from "../repositories/goal-repository.js";

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDate?: Date | null;
  status?: GoalStatus;
  roleId?: string | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  targetDate?: Date | null;
  status?: GoalStatus;
  roleId?: string | null;
}

/** Derived progress for a goal — the share of its tasks that are done. */
export interface GoalProgress {
  total: number;
  done: number;
  /** 0..1; 0 when the goal has no tasks. */
  ratio: number;
}

/** A goal plus its derived progress — the shape the API/UI consume. */
export type GoalWithProgress = Goal & { progress: GoalProgress };

function deriveProgress(goal: GoalWithTasks): GoalWithProgress {
  const total = goal.tasks.length;
  const done = goal.tasks.filter((t) => t.status === "DONE").length;
  const { tasks: _tasks, ...rest } = goal;
  return { ...rest, progress: { total, done, ratio: total ? done / total : 0 } };
}

/**
 * Business logic for goals (Habit 2). Progress is always DERIVED from the goal's
 * tasks, never stored — consistent with how the task quadrant works.
 */
export class GoalService {
  constructor(private readonly goals: GoalRepository) {}

  async create(input: CreateGoalInput): Promise<GoalWithProgress> {
    const data: Prisma.GoalCreateInput = {
      title: input.title,
      description: input.description,
      targetDate: input.targetDate ?? null,
      ...(input.status ? { status: input.status } : {}),
      ...(input.roleId ? { role: { connect: { id: input.roleId } } } : {}),
    };
    return deriveProgress(await this.goals.create(data));
  }

  async get(id: string): Promise<GoalWithProgress | null> {
    const goal = await this.goals.findById(id);
    return goal ? deriveProgress(goal) : null;
  }

  async list(status?: GoalStatus): Promise<GoalWithProgress[]> {
    const where = status ? { status } : undefined;
    return (await this.goals.findMany(where)).map(deriveProgress);
  }

  async update(id: string, input: UpdateGoalInput): Promise<GoalWithProgress> {
    const data: Prisma.GoalUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.targetDate !== undefined) data.targetDate = input.targetDate;
    if (input.status !== undefined) data.status = input.status;
    if (input.roleId !== undefined) {
      data.role = input.roleId
        ? { connect: { id: input.roleId } }
        : { disconnect: true };
    }
    return deriveProgress(await this.goals.update(id, data));
  }

  async remove(id: string): Promise<void> {
    await this.goals.delete(id);
  }
}
