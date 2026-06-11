import { createHash, randomBytes } from "node:crypto";
import type { ApiKey } from "@prisma/client";
import type { ApiKeyRepository } from "../repositories/api-key-repository.js";

const KEY_PREFIX = "clockcompass_sk_";

/** What the UI/API may see — never the hash, never the plaintext. */
export interface ApiKeyView {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

function hash(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

function toView(key: ApiKey): ApiKeyView {
  return {
    id: key.id,
    name: key.name,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
  };
}

/**
 * Token auth for agents/services. Plaintext keys are shown ONCE at creation;
 * only a SHA-256 hash is stored. Revocation is a tombstone, not a delete, so
 * the audit trail (name, last used) survives.
 */
export class ApiKeyService {
  constructor(private readonly keys: ApiKeyRepository) {}

  /** Create a key. The returned plaintext is the only time it is visible. */
  async generate(name: string): Promise<{ key: string; record: ApiKeyView }> {
    const plaintext = KEY_PREFIX + randomBytes(24).toString("hex");
    const record = await this.keys.create(name, hash(plaintext));
    return { key: plaintext, record: toView(record) };
  }

  /** Verify a presented bearer token; touches lastUsedAt on success. */
  async verify(plaintext: string): Promise<boolean> {
    if (!plaintext.startsWith(KEY_PREFIX)) return false;
    const record = await this.keys.findByHash(hash(plaintext));
    if (!record || record.revokedAt) return false;
    // Fire-and-forget: auth must not fail because the timestamp write did.
    void this.keys.touch(record.id).catch(() => {});
    return true;
  }

  async list(): Promise<ApiKeyView[]> {
    return (await this.keys.findMany()).map(toView);
  }

  async revoke(id: string): Promise<ApiKeyView> {
    return toView(await this.keys.revoke(id));
  }
}
