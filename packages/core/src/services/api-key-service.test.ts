import { beforeEach, describe, expect, it } from "vitest";
import type { ApiKey } from "@prisma/client";
import type { ApiKeyRepository } from "../repositories/api-key-repository.js";
import { ApiKeyService } from "./api-key-service.js";

class FakeApiKeyRepository implements ApiKeyRepository {
  store = new Map<string, ApiKey>();
  private seq = 0;

  async create(name: string, hashedKey: string): Promise<ApiKey> {
    const key: ApiKey = {
      id: `key_${++this.seq}`,
      name,
      hashedKey,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.store.set(key.id, key);
    return key;
  }

  async findByHash(hashedKey: string): Promise<ApiKey | null> {
    return [...this.store.values()].find((k) => k.hashedKey === hashedKey) ?? null;
  }

  async findMany(): Promise<ApiKey[]> {
    return [...this.store.values()];
  }

  async revoke(id: string): Promise<ApiKey> {
    const key = this.store.get(id);
    if (!key) throw new Error("not found");
    key.revokedAt = new Date();
    return key;
  }

  async touch(id: string): Promise<void> {
    const key = this.store.get(id);
    if (key) key.lastUsedAt = new Date();
  }
}

describe("ApiKeyService", () => {
  let repo: FakeApiKeyRepository;
  let service: ApiKeyService;

  beforeEach(() => {
    repo = new FakeApiKeyRepository();
    service = new ApiKeyService(repo);
  });

  it("generates a prefixed key and stores only a hash", async () => {
    const { key, record } = await service.generate("Claude · planning agent");
    expect(key).toMatch(/^bigrocks_sk_[0-9a-f]{48}$/);
    expect(record.name).toBe("Claude · planning agent");
    const stored = repo.store.get(record.id)!;
    expect(stored.hashedKey).not.toContain(key);
    expect(stored.hashedKey).toHaveLength(64); // sha256 hex
  });

  it("verifies a valid key and touches lastUsedAt", async () => {
    const { key, record } = await service.generate("agent");
    expect(await service.verify(key)).toBe(true);
    // touch is fire-and-forget; let the microtask run.
    await new Promise((r) => setTimeout(r, 0));
    expect(repo.store.get(record.id)!.lastUsedAt).not.toBeNull();
  });

  it("rejects unknown, malformed, and revoked keys", async () => {
    const { key, record } = await service.generate("agent");
    expect(await service.verify("bigrocks_sk_" + "0".repeat(48))).toBe(false);
    expect(await service.verify("not-a-key")).toBe(false);
    await service.revoke(record.id);
    expect(await service.verify(key)).toBe(false);
  });

  it("lists views without hashes", async () => {
    await service.generate("a");
    const [view] = await service.list();
    expect(view).not.toHaveProperty("hashedKey");
    expect(view).toHaveProperty("name", "a");
  });
});
