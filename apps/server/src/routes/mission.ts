import type { FastifyInstance } from "fastify";
import { MissionService, PrismaMissionRepository, prisma } from "@clock-compass/core";

/** Mission statement routes (Habit 2). Single active document, versioned. */
export async function missionRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new MissionService(new PrismaMissionRepository(prisma));

  const missionSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      content: { type: "string" },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  } as const;

  const auth = { preHandler: fastify.requireAuth };
  const secured = [{ bearerAuth: [] }];

  fastify.get(
    "/mission",
    {
      ...auth,
      schema: {
        description: "Get the active mission statement (null if none yet).",
        tags: ["mission"],
        security: secured,
        response: {
          200: { oneOf: [missionSchema, { type: "null" }] },
        },
      },
    },
    async () => service.getActive(),
  );

  fastify.get(
    "/mission/history",
    {
      ...auth,
      schema: {
        description: "All mission-statement versions, newest first.",
        tags: ["mission"],
        security: secured,
        response: { 200: { type: "array", items: missionSchema } },
      },
    },
    async () => service.history(),
  );

  fastify.put(
    "/mission",
    {
      ...auth,
      schema: {
        description: "Set the mission statement (creates a new active version).",
        tags: ["mission"],
        security: secured,
        body: {
          type: "object",
          required: ["content"],
          additionalProperties: false,
          properties: { content: { type: "string", minLength: 1 } },
        },
        response: { 200: missionSchema },
      },
    },
    async (req) => service.set((req.body as { content: string }).content),
  );
}
