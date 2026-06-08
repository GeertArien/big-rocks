import type { Goal, Prisma, PrismaClient, TaskStatus } from "@prisma/client";

/** A goal with just enough of its tasks to derive progress. */
export type GoalWithTasks = Goal & { tasks: { status: TaskStatus }[] };

/**
 * The only place Prisma is touched for goals. Goals are returned with a slim
 * view of their tasks (status only) so the service can derive progress.
 */
export interface GoalRepository {
  create(data: Prisma.GoalCreateInput): Promise<GoalWithTasks>;
  findById(id: string): Promise<GoalWithTasks | null>;
  findMany(where?: Prisma.GoalWhereInput): Promise<GoalWithTasks[]>;
  update(id: string, data: Prisma.GoalUpdateInput): Promise<GoalWithTasks>;
  delete(id: string): Promise<void>;
}

const withTasks = {
  tasks: { select: { status: true } },
} satisfies Prisma.GoalInclude;

export class PrismaGoalRepository implements GoalRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: Prisma.GoalCreateInput): Promise<GoalWithTasks> {
    return this.db.goal.create({ data, include: withTasks });
  }

  findById(id: string): Promise<GoalWithTasks | null> {
    return this.db.goal.findUnique({ where: { id }, include: withTasks });
  }

  findMany(where?: Prisma.GoalWhereInput): Promise<GoalWithTasks[]> {
    return this.db.goal.findMany({
      where,
      include: withTasks,
      orderBy: { createdAt: "desc" },
    });
  }

  update(id: string, data: Prisma.GoalUpdateInput): Promise<GoalWithTasks> {
    return this.db.goal.update({ where: { id }, data, include: withTasks });
  }

  async delete(id: string): Promise<void> {
    // Tasks keep existing; their goalId is set null (schema onDelete: SetNull).
    await this.db.goal.delete({ where: { id } });
  }
}
