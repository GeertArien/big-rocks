import { beforeEach, describe, expect, it } from "vitest";
import type { Prisma, Task } from "@prisma/client";
import type { TaskRepository } from "../repositories/task-repository.js";
import { TaskService } from "./task-service.js";

/** An in-memory fake repository — lets us test the service with no database. */
class FakeTaskRepository implements TaskRepository {
  private store = new Map<string, Task>();
  private seq = 0;

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    const id = `task_${++this.seq}`;
    const now = new Date();
    const task: Task = {
      id,
      title: data.title,
      notes: (data.notes as string | null) ?? null,
      important: (data.important as boolean | undefined) ?? false,
      urgent: (data.urgent as boolean | undefined) ?? false,
      status: "TODO",
      proactivity: null,
      isBigRock: false,
      plannedWeek: null,
      dueDate: (data.dueDate as Date | null) ?? null,
      completedAt: null,
      goalId: null,
      source: "MANUAL",
      externalId: null,
      externalPriority: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, task);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }

  async findMany(): Promise<Task[]> {
    return [...this.store.values()];
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    const existing = this.store.get(id);
    if (!existing) throw new Error("not found");
    const updated = { ...existing, ...data } as Task;
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

describe("TaskService", () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService(new FakeTaskRepository());
  });

  it("attaches the derived quadrant on create", async () => {
    const task = await service.create({
      title: "Write quarterly goals",
      important: true,
      urgent: false,
    });
    expect(task.quadrant).toBe("Q2");
  });

  it("marks a task done with a completion timestamp", async () => {
    const created = await service.create({ title: "Pay bill", urgent: true });
    const done = await service.complete(created.id);
    expect(done.status).toBe("DONE");
    expect(done.completedAt).toBeInstanceOf(Date);
  });

  it("lists created tasks", async () => {
    await service.create({ title: "A" });
    await service.create({ title: "B" });
    expect(await service.list()).toHaveLength(2);
  });
});
