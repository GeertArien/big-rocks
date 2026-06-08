import { beforeEach, describe, expect, it } from "vitest";
import type { MissionStatement } from "@prisma/client";
import type { MissionRepository } from "../repositories/mission-repository.js";
import { MissionService } from "./mission-service.js";

class FakeMissionRepository implements MissionRepository {
  private versions: MissionStatement[] = [];
  private seq = 0;

  async getActive(): Promise<MissionStatement | null> {
    return this.versions.find((v) => v.isActive) ?? null;
  }

  async listVersions(): Promise<MissionStatement[]> {
    return [...this.versions].reverse();
  }

  async replace(content: string): Promise<MissionStatement> {
    this.versions.forEach((v) => (v.isActive = false));
    const now = new Date();
    const created: MissionStatement = {
      id: `mission_${++this.seq}`,
      content,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.versions.push(created);
    return created;
  }
}

describe("MissionService", () => {
  let service: MissionService;

  beforeEach(() => {
    service = new MissionService(new FakeMissionRepository());
  });

  it("returns null before any statement is written", async () => {
    expect(await service.getActive()).toBeNull();
  });

  it("rejects an empty statement", async () => {
    await expect(service.set("   ")).rejects.toThrow();
  });

  it("versions edits: only the latest is active, history is retained", async () => {
    await service.set("First mission");
    const second = await service.set("Refined mission");
    const active = await service.getActive();
    expect(active?.content).toBe("Refined mission");
    expect(active?.id).toBe(second.id);
    const history = await service.history();
    expect(history).toHaveLength(2);
    expect(history.filter((v) => v.isActive)).toHaveLength(1);
  });
});
