import { beforeEach, describe, expect, it } from "vitest";
import type { Goal, Prisma, TaskStatus } from "@prisma/client";
import type {
  GoalRepository,
  GoalWithTasks,
} from "../repositories/goal-repository.js";
import { GoalService } from "./goal-service.js";

class FakeGoalRepository implements GoalRepository {
  private store = new Map<string, GoalWithTasks>();
  private seq = 0;

  async create(data: Prisma.GoalCreateInput): Promise<GoalWithTasks> {
    const id = `goal_${++this.seq}`;
    const now = new Date();
    const goal: GoalWithTasks = {
      id,
      title: data.title,
      description: (data.description as string | null) ?? null,
      targetDate: (data.targetDate as Date | null) ?? null,
      status: (data.status as Goal["status"] | undefined) ?? "ACTIVE",
      roleId: data.role?.connect?.id ?? null,
      dimension: null,
      createdAt: now,
      updatedAt: now,
      tasks: [],
    };
    this.store.set(id, goal);
    return goal;
  }

  async findById(id: string): Promise<GoalWithTasks | null> {
    return this.store.get(id) ?? null;
  }

  async findMany(where?: Prisma.GoalWhereInput): Promise<GoalWithTasks[]> {
    let goals = [...this.store.values()];
    if (where?.status) goals = goals.filter((g) => g.status === where.status);
    return goals;
  }

  async update(id: string, data: Prisma.GoalUpdateInput): Promise<GoalWithTasks> {
    const existing = this.store.get(id);
    if (!existing) throw new Error("not found");
    const updated = { ...existing, ...data } as GoalWithTasks;
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /** Test helper: attach task statuses to a goal so progress can be derived. */
  setTasks(id: string, statuses: TaskStatus[]): void {
    const goal = this.store.get(id);
    if (goal) goal.tasks = statuses.map((status) => ({ status }));
  }
}

describe("GoalService", () => {
  let repo: FakeGoalRepository;
  let service: GoalService;

  beforeEach(() => {
    repo = new FakeGoalRepository();
    service = new GoalService(repo);
  });

  it("creates a goal defaulting to ACTIVE with zero progress", async () => {
    const goal = await service.create({ title: "Ship v1" });
    expect(goal.status).toBe("ACTIVE");
    expect(goal.progress).toEqual({ total: 0, done: 0, ratio: 0 });
  });

  it("derives progress from the goal's tasks", async () => {
    const goal = await service.create({ title: "Read 12 books" });
    repo.setTasks(goal.id, ["DONE", "DONE", "TODO", "TODO"]);
    const fetched = await service.get(goal.id);
    expect(fetched?.progress).toEqual({ total: 4, done: 2, ratio: 0.5 });
  });

  it("updates status and filters by it", async () => {
    const a = await service.create({ title: "A" });
    await service.create({ title: "B" });
    await service.update(a.id, { status: "ACHIEVED" });
    expect(await service.list("ACHIEVED")).toHaveLength(1);
    expect(await service.list("ACTIVE")).toHaveLength(1);
  });
});
