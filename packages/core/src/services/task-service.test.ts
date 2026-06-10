import { beforeEach, describe, expect, it } from "vitest";
import type { Prisma, Task } from "@prisma/client";
import type { TaskRepository } from "../repositories/task-repository.js";
import { TaskService, groupByQuadrant } from "./task-service.js";
import { startOfIsoWeek } from "../domain/week.js";

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
      projectId: null,
      scheduledDay: (data.scheduledDay as Date | null) ?? null,
      scheduledTime: (data.scheduledTime as string | null) ?? null,
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

  async findMany(where?: Prisma.TaskWhereInput): Promise<Task[]> {
    let tasks = [...this.store.values()];
    if (where?.status) tasks = tasks.filter((t) => t.status === where.status);
    if (where?.important !== undefined)
      tasks = tasks.filter((t) => t.important === where.important);
    if (where?.urgent !== undefined)
      tasks = tasks.filter((t) => t.urgent === where.urgent);
    if (where?.plannedWeek !== undefined) {
      const wk = where.plannedWeek as Date;
      tasks = tasks.filter(
        (t) => t.plannedWeek?.getTime() === wk.getTime(),
      );
    }
    return tasks;
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    const existing = this.store.get(id);
    if (!existing) throw new Error("not found");
    // Flatten the subset of Prisma update shapes the service produces.
    const patch: Partial<Task> = {};
    for (const key of [
      "title",
      "notes",
      "important",
      "urgent",
      "dueDate",
      "isBigRock",
      "plannedWeek",
      "status",
      "completedAt",
      "scheduledDay",
      "scheduledTime",
    ] as const) {
      if (data[key] !== undefined) {
        // @ts-expect-error narrow assignment from Prisma update fields
        patch[key] = data[key];
      }
    }
    const updated = { ...existing, ...patch } as Task;
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

  it("re-derives the quadrant when importance/urgency change", async () => {
    const task = await service.create({ title: "Triage", important: false, urgent: true });
    expect(task.quadrant).toBe("Q3");
    const moved = await service.update(task.id, { important: true });
    expect(moved.quadrant).toBe("Q1");
  });

  it("marks done and reopens a task", async () => {
    const created = await service.create({ title: "Pay bill", urgent: true });
    const done = await service.complete(created.id);
    expect(done.status).toBe("DONE");
    expect(done.completedAt).toBeInstanceOf(Date);
    const reopened = await service.reopen(created.id);
    expect(reopened.status).toBe("TODO");
    expect(reopened.completedAt).toBeNull();
  });

  it("pins and clears a big rock for the current week", async () => {
    const created = await service.create({
      title: "Plan the week",
      important: true,
      urgent: false,
    });
    const pinned = await service.setBigRock(created.id, true);
    expect(pinned.isBigRock).toBe(true);
    expect(pinned.plannedWeek?.getTime()).toBe(startOfIsoWeek().getTime());

    const bigRocks = await service.bigRocksForWeek();
    expect(bigRocks.map((t) => t.id)).toContain(created.id);

    const cleared = await service.setBigRock(created.id, false);
    expect(cleared.isBigRock).toBe(false);
    expect(cleared.plannedWeek).toBeNull();
    expect(await service.bigRocksForWeek()).toHaveLength(0);
  });

  it("schedules a task into a day with an optional time, and unschedules it", async () => {
    const day = new Date("2026-06-13T00:00:00.000Z");
    const created = await service.create({ title: "Date night", scheduledDay: day });
    expect(created.scheduledDay?.getTime()).toBe(day.getTime());
    expect(created.scheduledTime).toBeNull();

    const timed = await service.update(created.id, { scheduledTime: "19:30" });
    expect(timed.scheduledTime).toBe("19:30");

    // Scheduling never touches the quadrant — urgency stays a human judgment.
    expect(timed.quadrant).toBe(created.quadrant);

    const unscheduled = await service.update(created.id, {
      scheduledDay: null,
      scheduledTime: null,
    });
    expect(unscheduled.scheduledDay).toBeNull();
    expect(unscheduled.scheduledTime).toBeNull();
  });

  it("lists created tasks and filters by status", async () => {
    const a = await service.create({ title: "A" });
    await service.create({ title: "B" });
    await service.complete(a.id);
    expect(await service.list()).toHaveLength(2);
    expect(await service.list({ status: "DONE" })).toHaveLength(1);
    expect(await service.list({ status: "TODO" })).toHaveLength(1);
  });

  it("removes a task", async () => {
    const created = await service.create({ title: "Temp" });
    await service.remove(created.id);
    expect(await service.get(created.id)).toBeNull();
  });
});

describe("groupByQuadrant", () => {
  it("buckets tasks into Q1-Q4", async () => {
    const service = new TaskService(new FakeTaskRepository());
    await service.create({ title: "q1", important: true, urgent: true });
    await service.create({ title: "q2", important: true, urgent: false });
    await service.create({ title: "q4", important: false, urgent: false });
    const groups = groupByQuadrant(await service.list());
    expect(groups.Q1).toHaveLength(1);
    expect(groups.Q2).toHaveLength(1);
    expect(groups.Q3).toHaveLength(0);
    expect(groups.Q4).toHaveLength(1);
  });
});
