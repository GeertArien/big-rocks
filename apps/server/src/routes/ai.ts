import type { FastifyInstance } from "fastify";
import {
  AiService,
  AnthropicAiProvider,
  NoopAiProvider,
  OpenAiCompatibleProvider,
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
} from "@clock-compass/core";

export interface AiRouteOptions {
  aiProvider: string | undefined;
  anthropicApiKey: string | undefined;
  anthropicModel: string | undefined;
  openaiBaseUrl: string | undefined;
  openaiApiKey: string | undefined;
  openaiModel: string | undefined;
}

/**
 * Pick the provider from the environment. AI_PROVIDER forces a choice;
 * otherwise it's inferred: Anthropic when ANTHROPIC_API_KEY is set, else an
 * OpenAI-compatible endpoint (ChatGPT, Ollama, LM Studio, OpenRouter…) when
 * OPENAI_BASE_URL + OPENAI_MODEL are set, else the Noop provider (AI off).
 */
export function selectProvider(options: AiRouteOptions): AiProvider {
  const openaiConfigured = !!(options.openaiBaseUrl && options.openaiModel);
  const choice =
    options.aiProvider ??
    (options.anthropicApiKey ? "anthropic" : openaiConfigured ? "openai-compatible" : "none");

  if (choice === "anthropic" && options.anthropicApiKey) {
    return new AnthropicAiProvider({
      apiKey: options.anthropicApiKey,
      model: options.anthropicModel,
    });
  }
  if (choice === "openai-compatible" && openaiConfigured) {
    return new OpenAiCompatibleProvider({
      baseUrl: options.openaiBaseUrl!,
      apiKey: options.openaiApiKey,
      model: options.openaiModel!,
    });
  }
  return new NoopAiProvider();
}

/**
 * AI jobs (build-order step 7). All behind the swappable AiProvider; with no
 * provider configured the routes answer 503 instead of calling out.
 * `unaligned` is deterministic and works without a key.
 */
export async function aiRoutes(
  fastify: FastifyInstance,
  options: AiRouteOptions,
): Promise<void> {
  const provider = selectProvider(options);

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

  const AI_DISABLED = {
    error:
      "AI is disabled — set ANTHROPIC_API_KEY (or OPENAI_BASE_URL + OPENAI_MODEL) on the server.",
  };

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
      if (!provider.available) return reply.code(503).send(AI_DISABLED);
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
      if (!provider.available) return reply.code(503).send(AI_DISABLED);
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
      if (!provider.available) return reply.code(503).send(AI_DISABLED);
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
      if (!provider.available) return reply.code(503).send(AI_DISABLED);
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
      if (!provider.available) return reply.code(503).send(AI_DISABLED);
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
