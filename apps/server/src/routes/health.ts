import type { FastifyInstance } from "fastify";

/** Public liveness route — no auth, used by Docker healthchecks and the UI. */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/health",
    {
      schema: {
        description: "Liveness check.",
        tags: ["system"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              uptime: { type: "number" },
            },
            required: ["status", "uptime"],
          },
        },
      },
    },
    async () => ({ status: "ok", uptime: process.uptime() }),
  );
}
