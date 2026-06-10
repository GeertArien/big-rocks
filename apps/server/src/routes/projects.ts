import type { FastifyInstance } from "fastify";
import { PrismaProjectRepository, ProjectService, prisma } from "@big-rocks/core";

const PROJECT_STATUSES = ["ACTIVE", "SOMEDAY", "DONE"] as const;

/**
 * Project routes: the layer between goals and tasks. Deleting a project
 * returns its tasks to the Inbox (kept, unlinked) — never deletes them.
 */
export async function projectRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new ProjectService(new PrismaProjectRepository(prisma));

  const projectSchema = {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: ["string", "null"] },
      status: { type: "string", enum: PROJECT_STATUSES },
      goalId: { type: ["string", "null"] },
      progress: {
        type: "object",
        properties: {
          total: { type: "integer" },
          done: { type: "integer" },
          ratio: { type: "number" },
        },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  } as const;

  const errorSchema = {
    type: "object",
    properties: { error: { type: "string" } },
  } as const;

  const auth = { preHandler: fastify.requireAuth };
  const secured = [{ bearerAuth: [] }];

  fastify.get(
    "/projects",
    {
      ...auth,
      schema: {
        description: "List projects (optionally by status), each with derived task counts.",
        tags: ["projects"],
        security: secured,
        querystring: {
          type: "object",
          properties: { status: { type: "string", enum: PROJECT_STATUSES } },
        },
        response: { 200: { type: "array", items: projectSchema } },
      },
    },
    async (req) => {
      const { status } = req.query as { status?: (typeof PROJECT_STATUSES)[number] };
      return service.list(status);
    },
  );

  fastify.get(
    "/projects/:id",
    {
      ...auth,
      schema: {
        description: "Fetch a project with its task counts.",
        tags: ["projects"],
        security: secured,
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        response: { 200: projectSchema, 404: errorSchema },
      },
    },
    async (req, reply) => {
      const project = await service.get((req.params as { id: string }).id);
      if (!project) return reply.code(404).send({ error: "Project not found" });
      return project;
    },
  );

  fastify.post(
    "/projects",
    {
      ...auth,
      schema: {
        description: "Create a project, optionally serving a goal.",
        tags: ["projects"],
        security: secured,
        body: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
            description: { type: "string" },
            goalId: { type: "string" },
            status: { type: "string", enum: PROJECT_STATUSES },
          },
        },
        response: { 201: projectSchema },
      },
    },
    async (req, reply) => {
      const project = await service.create(
        req.body as {
          name: string;
          description?: string;
          goalId?: string;
          status?: (typeof PROJECT_STATUSES)[number];
        },
      );
      reply.code(201);
      return project;
    },
  );

  fastify.patch(
    "/projects/:id",
    {
      ...auth,
      schema: {
        description: "Update a project (rename, relink to a goal, change status).",
        tags: ["projects"],
        security: secured,
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
            description: { type: ["string", "null"] },
            goalId: { type: ["string", "null"] },
            status: { type: "string", enum: PROJECT_STATUSES },
          },
        },
        response: { 200: projectSchema, 404: errorSchema },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      if ((await service.get(id)) === null) {
        return reply.code(404).send({ error: "Project not found" });
      }
      return service.update(id, req.body as Record<string, never>);
    },
  );

  fastify.delete(
    "/projects/:id",
    {
      ...auth,
      schema: {
        description: "Delete a project. Its tasks return to the Inbox (kept, unlinked).",
        tags: ["projects"],
        security: secured,
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        response: { 204: { type: "null" } },
      },
    },
    async (req, reply) => {
      await service.remove((req.params as { id: string }).id);
      reply.code(204);
    },
  );
}
