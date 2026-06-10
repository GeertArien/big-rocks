import type { FastifyInstance } from "fastify";
import {
  AiService,
  AnthropicAiProvider,
  NoopAiProvider,
  PeopleService,
  ProjectService,
  RenewalService,
  TaskService,
  PrismaCommitmentRepository,
  PrismaHabitRepository,
  PrismaPersonRepository,
  PrismaProjectRepository,
  PrismaTaskRepository,
  prisma,
  type AiProvider,
} from "@big-rocks/core";

export interface AiRouteOptions {
  anthropicApiKey: string | undefined;
  anthropicModel: string | undefined;
}

/**
 * AI jobs (build-order step 7). All behind the swappable AiProvider; with no
 * ANTHROPIC_API_KEY the routes answer 503 instead of calling out. `unaligned`
 * is deterministic and works without a key.
 */
export async function aiRoutes(
  fastify: FastifyInstance,
  options: AiRouteOptions,
): Promise<void> {
  const provider: AiProvider = options.anthropicApiKey
    ? new AnthropicAiProvider({
        apiKey: options.anthropicApiKey,
        model: options.anthropicModel,
      })
    : new NoopAiProvider();

  const service = new AiService(
    provider,
    new TaskService(new PrismaTaskRepository(prisma)),
    new ProjectService(new PrismaProjectRepository(prisma)),
    new PeopleService(
      new PrismaPersonRepository(prisma),
      new PrismaCommitmentRepository(prisma),
    ),
    new RenewalService(new PrismaHabitRepository(prisma)),
  );

  const classificationSchema = {
    type: "object",
    properties: {
      title: { type: "string" },
      important: { type: "boolean" },
      urgent: { type: "boolean" },
      proactivity: { type: ["string", "null"], enum: ["INFLUENCE", "CONCERN", null] },
      dueDate: { type: ["string", "null"] },
      rationale: { type: "string" },
    },
  } as const;

  const taskSchema = { type: "object", additionalProperties: true } as const;

  const errorSchema = {
    type: "object",
    properties: { error: { type: "string" } },
  } as const;

  const auth = { preHandler: fastify.requireAuth };
  const secured = [{ bearerAuth: [] }];

  /** Shared guard: 503 when the provider is the no-op. */
  function requireAi(reply: { code: (n: number) => { send: (b: unknown) => unknown } }): boolean {
    if (provider.available) return true;
    reply.code(503).send({ error: "AI is disabled — set ANTHROPIC_API_KEY on the server." });
    return false;
  }

  fastify.get(
    "/ai/status",
    {
      ...auth,
      schema: {
        description: "Whether the AI provider is configured.",
        tags: ["ai"],
        security: secured,
        response: {
          200: { type: "object", properties: { available: { type: "boolean" } } },
        },
      },
    },
    async () => ({ available: provider.available }),
  );

  fastify.post(
    "/ai/classify",
    {
      ...auth,
      schema: {
        description: "Classify a free-text sentence (the capture preview) — creates nothing.",
        tags: ["ai"],
        security: secured,
        body: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: { text: { type: "string", minLength: 1 } },
        },
        response: { 200: classificationSchema, 503: errorSchema },
      },
    },
    async (req, reply) => {
      if (!requireAi(reply)) return;
      return service.classify((req.body as { text: string }).text);
    },
  );

  fastify.post(
    "/ai/intake",
    {
      ...auth,
      schema: {
        description: "Natural-language intake: POST a sentence → classify → create the task.",
        tags: ["ai"],
        security: secured,
        body: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: { text: { type: "string", minLength: 1 } },
        },
        response: {
          201: {
            type: "object",
            properties: { task: taskSchema, classification: classificationSchema },
          },
          503: errorSchema,
        },
      },
    },
    async (req, reply) => {
      if (!requireAi(reply)) return;
      const result = await service.intake((req.body as { text: string }).text);
      reply.code(201);
      return result;
    },
  );

  fastify.post(
    "/ai/tasks/:id/proactivity",
    {
      ...auth,
      schema: {
        description: "Habit 1: tag a task influence vs concern and persist it.",
        tags: ["ai"],
        security: secured,
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        response: { 200: taskSchema, 404: errorSchema, 503: errorSchema },
      },
    },
    async (req, reply) => {
      if (!requireAi(reply)) return;
      try {
        return await service.tagTask((req.params as { id: string }).id);
      } catch {
        return reply.code(404).send({ error: "Task not found" });
      }
    },
  );

  fastify.post(
    "/ai/mission/refine",
    {
      ...auth,
      schema: {
        description: "Habit 2: refine a mission-statement draft (nothing is saved).",
        tags: ["ai"],
        security: secured,
        body: {
          type: "object",
          required: ["draft"],
          additionalProperties: false,
          properties: { draft: { type: "string", minLength: 1 } },
        },
        response: {
          200: { type: "object", properties: { content: { type: "string" } } },
          503: errorSchema,
        },
      },
    },
    async (req, reply) => {
      if (!requireAi(reply)) return;
      return { content: await service.refineMission((req.body as { draft: string }).draft) };
    },
  );

  fastify.get(
    "/ai/review",
    {
      ...auth,
      schema: {
        description: "The weekly review summary, composed from the week's actual record.",
        tags: ["ai"],
        security: secured,
        response: {
          200: {
            type: "object",
            properties: {
              summary: { type: "string" },
              generatedAt: { type: "string", format: "date-time" },
            },
          },
          503: errorSchema,
        },
      },
    },
    async (_req, reply) => {
      if (!requireAi(reply)) return;
      return service.weeklyReview();
    },
  );

  fastify.get(
    "/ai/unaligned",
    {
      ...auth,
      schema: {
        description:
          "Habit 2 flag: open tasks and projects that connect to no goal (deterministic — works without AI).",
        tags: ["ai"],
        security: secured,
        response: {
          200: {
            type: "object",
            properties: {
              tasks: { type: "array", items: taskSchema },
              projects: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
        },
      },
    },
    async () => service.unaligned(),
  );
}
