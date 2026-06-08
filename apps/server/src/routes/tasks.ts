import type { FastifyInstance } from "fastify";
import { PrismaTaskRepository, TaskService, prisma } from "@big-rocks/core";

/**
 * Task routes. The handler stays thin: it validates input via JSON schema and
 * delegates all logic to the core TaskService. A scaffold slice (create + list
 * + big rocks); full CRUD lands with build-order step 2 (#3).
 */
export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new TaskService(new PrismaTaskRepository(prisma));

  const taskSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      important: { type: "boolean" },
      urgent: { type: "boolean" },
      quadrant: { type: "string", enum: ["Q1", "Q2", "Q3", "Q4"] },
      status: { type: "string" },
    },
  } as const;

  fastify.get(
    "/tasks",
    {
      preHandler: fastify.requireAuth,
      schema: {
        description: "List all tasks with their derived quadrant.",
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        response: { 200: { type: "array", items: taskSchema } },
      },
    },
    async () => service.list(),
  );

  fastify.post(
    "/tasks",
    {
      preHandler: fastify.requireAuth,
      schema: {
        description: "Create a task. Quadrant is derived from important/urgent.",
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 1 },
            notes: { type: "string" },
            important: { type: "boolean" },
            urgent: { type: "boolean" },
            goalId: { type: "string" },
          },
        },
        response: { 201: taskSchema },
      },
    },
    async (req, reply) => {
      const body = req.body as {
        title: string;
        notes?: string;
        important?: boolean;
        urgent?: boolean;
        goalId?: string;
      };
      const task = await service.create(body);
      reply.code(201);
      return task;
    },
  );

  fastify.get(
    "/tasks/big-rocks",
    {
      preHandler: fastify.requireAuth,
      schema: {
        description: "This week's big rocks (Q2 tasks planned into the week).",
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        response: { 200: { type: "array", items: taskSchema } },
      },
    },
    async () => service.bigRocksForWeek(),
  );
}
