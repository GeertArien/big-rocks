import type { MissionStatement } from "@prisma/client";
import type { MissionRepository } from "../repositories/mission-repository.js";

/**
 * The personal mission statement (Habit 2) — the top of the
 * mission -> goals -> tasks hierarchy. Single active document, versioned.
 */
export class MissionService {
  constructor(private readonly missions: MissionRepository) {}

  /** The current mission statement, or null if none has been written yet. */
  getActive(): Promise<MissionStatement | null> {
    return this.missions.getActive();
  }

  /** Past + present statements, newest first. */
  history(): Promise<MissionStatement[]> {
    return this.missions.listVersions();
  }

  /** Set the mission statement (creates a new active version). */
  async set(content: string): Promise<MissionStatement> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error("Mission statement cannot be empty.");
    return this.missions.replace(trimmed);
  }
}
