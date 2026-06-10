import type { FastifyInstance } from "fastify";
import {
  ImportService,
  ProjectService,
  TaskService,
  PrismaProjectRepository,
  PrismaTaskRepository,
  prisma,
} from "@big-rocks/core";

/**
 * Todoist CSV import (build-order step 8). The file content is posted as text
 * by the frontend — no Todoist credentials exist anywhere on the server.
 */
export async function importRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new ImportService(
    new TaskService(new PrismaTaskRepository(prisma)),
    new ProjectService(new PrismaProjectRepository(prisma)),
  );

  fastify.post(
    "/import/todoist",
    {
      preHandler: fastify.requireAuth,
      // Exports can be large; allow up to 10 MB for this route only.
      bodyLimit: 10 * 1024 * 1024,
      schema: {
        description:
          "Import a Todoist CSV export. p1–p4 seed importance/urgency; optional projectName groups the tasks under a Project (found or created).",
        tags: ["import"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["csv"],
          additionalProperties: false,
          properties: {
            csv: { type: "string", minLength: 1 },
            projectName: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              imported: { type: "integer" },
              skipped: { type: "integer" },
              projectId: { type: ["string", "null"] },
            },
          },
          400: { type: "object", properties: { error: { type: "string" } } },
        },
      },
    },
    async (req, reply) => {
      const body = req.body as { csv: string; projectName?: string };
      try {
        const result = await service.importTodoist(body.csv, {
          projectName: body.projectName,
        });
        reply.code(201);
        return result;
      } catch (err) {
        return reply
          .code(400)
          .send({ error: err instanceof Error ? err.message : "Import failed" });
      }
    },
  );
}
