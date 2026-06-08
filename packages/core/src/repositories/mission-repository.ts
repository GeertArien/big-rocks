import type { MissionStatement, PrismaClient } from "@prisma/client";

/**
 * Mission statements are versioned: there is at most one active row, and editing
 * creates a new active version while retaining the old ones as history.
 */
export interface MissionRepository {
  getActive(): Promise<MissionStatement | null>;
  listVersions(): Promise<MissionStatement[]>;
  /** Deactivate the current active statement and create a new active one. */
  replace(content: string): Promise<MissionStatement>;
}

export class PrismaMissionRepository implements MissionRepository {
  constructor(private readonly db: PrismaClient) {}

  getActive(): Promise<MissionStatement | null> {
    return this.db.missionStatement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  listVersions(): Promise<MissionStatement[]> {
    return this.db.missionStatement.findMany({ orderBy: { createdAt: "desc" } });
  }

  replace(content: string): Promise<MissionStatement> {
    return this.db.$transaction(async (tx) => {
      await tx.missionStatement.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      return tx.missionStatement.create({ data: { content, isActive: true } });
    });
  }
}
