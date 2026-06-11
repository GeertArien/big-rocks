import type { FastifyInstance } from "fastify";
import type { ApiKeyService } from "@clock-compass/core";

/**
 * Agent/service access: named API keys. The plaintext is returned exactly
 * once at creation; only a hash is stored. Revoking keeps the audit row.
 */
export async function keyRoutes(
  fastify: FastifyInstance,
  service: ApiKeyService,
): Promise<void> {
  const keySchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      lastUsedAt: { type: ["string", "null"], format: "date-time" },
      revokedAt: { type: ["string", "null"], format: "date-time" },
    },
  } as const;

  const auth = { preHandler: fastify.requireAuth };
  const secured = [{ bearerAuth: [] }];

  fastify.get(
    "/keys",
    {
      ...auth,
      schema: {
        description: "List API keys (names and usage — never hashes or plaintext).",
        tags: ["keys"],
        security: secured,
        response: { 200: { type: "array", items: keySchema } },
      },
    },
    async () => service.list(),
  );

  fastify.post(
    "/keys",
    {
      ...auth,
      schema: {
        description:
          "Create an API key. The plaintext `key` in the response is shown ONCE.",
        tags: ["keys"],
        security: secured,
        body: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: { name: { type: "string", minLength: 1 } },
        },
        response: {
          201: {
            type: "object",
            properties: { key: { type: "string" }, record: keySchema },
          },
        },
      },
    },
    async (req, reply) => {
      const created = await service.generate((req.body as { name: string }).name);
      reply.code(201);
      return created;
    },
  );

  fastify.post(
    "/keys/:id/revoke",
    {
      ...auth,
      schema: {
        description: "Revoke an API key (tombstone — the audit row is kept).",
        tags: ["keys"],
        security: secured,
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        response: { 200: keySchema },
      },
    },
    async (req) => service.revoke((req.params as { id: string }).id),
  );
}
