import { beforeEach, describe, expect, it } from "vitest";
import type { Prisma, Project, TaskStatus } from "@prisma/client";
import type {
  ProjectRepository,
  ProjectWithTasks,
} from "../repositories/project-repository.js";
import { ProjectService } from "./project-service.js";

class FakeProjectRepository implements ProjectRepository {
  private store = new Map<string, ProjectWithTasks>();
  private seq = 0;

  async create(data: Prisma.ProjectCreateInput): Promise<ProjectWithTasks> {
    const id = `proj_${++this.seq}`;
    const now = new Date();
    const project: ProjectWithTasks = {
      id,
      name: data.name,
      description: (data.description as string | null) ?? null,
      status: (data.status as Project["status"] | undefined) ?? "ACTIVE",
      goalId: data.goal?.connect?.id ?? null,
      createdAt: now,
      updatedAt: now,
      tasks: [],
    };
    this.store.set(id, project);
    return project;
  }

  async findById(id: string): Promise<ProjectWithTasks | null> {
    return this.store.get(id) ?? null;
  }

  async findMany(where?: Prisma.ProjectWhereInput): Promise<ProjectWithTasks[]> {
    let projects = [...this.store.values()];
    if (where?.status) projects = projects.filter((p) => p.status === where.status);
    return projects;
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<ProjectWithTasks> {
    const existing = this.store.get(id);
    if (!existing) throw new Error("not found");
    const { goal, ...rest } = data;
    const updated = { ...existing, ...rest } as ProjectWithTasks;
    if (goal) {
      updated.goalId = "connect" in goal && goal.connect ? (goal.connect.id ?? null) : null;
    }
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /** Test helper: attach task statuses so counts can be derived. */
  setTasks(id: string, statuses: TaskStatus[]): void {
    const project = this.store.get(id);
    if (project) project.tasks = statuses.map((status) => ({ status }));
  }
}

describe("ProjectService", () => {
  let repo: FakeProjectRepository;
  let service: ProjectService;

  beforeEach(() => {
    repo = new FakeProjectRepository();
    service = new ProjectService(repo);
  });

  it("creates a project defaulting to ACTIVE with zero counts", async () => {
    const project = await service.create({ name: "Base building" });
    expect(project.status).toBe("ACTIVE");
    expect(project.goalId).toBeNull();
    expect(project.progress).toEqual({ total: 0, done: 0, ratio: 0 });
  });

  it("derives counts from the project's tasks", async () => {
    const project = await service.create({ name: "MCP adapter" });
    repo.setTasks(project.id, ["DONE", "TODO", "TODO"]);
    const fetched = await service.get(project.id);
    expect(fetched?.progress).toEqual({ total: 3, done: 1, ratio: 1 / 3 });
  });

  it("links and unlinks a goal", async () => {
    const project = await service.create({ name: "Race prep", goalId: "goal_1" });
    expect(project.goalId).toBe("goal_1");
    const unlinked = await service.update(project.id, { goalId: null });
    expect(unlinked.goalId).toBeNull();
  });

  it("updates status and filters by it", async () => {
    const a = await service.create({ name: "A" });
    await service.create({ name: "B" });
    await service.update(a.id, { status: "SOMEDAY" });
    expect(await service.list("SOMEDAY")).toHaveLength(1);
    expect(await service.list("ACTIVE")).toHaveLength(1);
  });
});
