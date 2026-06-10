import type { ApiKey, PrismaClient } from "@prisma/client";

/** The only place Prisma is touched for API keys. Only hashes are stored. */
export interface ApiKeyRepository {
  create(name: string, hashedKey: string): Promise<ApiKey>;
  findByHash(hashedKey: string): Promise<ApiKey | null>;
  findMany(): Promise<ApiKey[]>;
  revoke(id: string): Promise<ApiKey>;
  touch(id: string): Promise<void>;
}

export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly db: PrismaClient) {}

  create(name: string, hashedKey: string): Promise<ApiKey> {
    return this.db.apiKey.create({ data: { name, hashedKey } });
  }

  findByHash(hashedKey: string): Promise<ApiKey | null> {
    return this.db.apiKey.findUnique({ where: { hashedKey } });
  }

  findMany(): Promise<ApiKey[]> {
    return this.db.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  }

  revoke(id: string): Promise<ApiKey> {
    return this.db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async touch(id: string): Promise<void> {
    await this.db.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  }
}
