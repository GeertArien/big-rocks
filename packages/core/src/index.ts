// Public surface of the shared core. The server and the future MCP adapter
// import from here — never from deep paths and never the Prisma client directly.

export { prisma } from "./db/client.js";

// Domain helpers
export {
  deriveQuadrant,
  isBigRockQuadrant,
  QUADRANT_LABELS,
  type Quadrant,
  type ImportanceUrgency,
} from "./domain/quadrant.js";
export { startOfIsoWeek, isSameIsoWeek } from "./domain/week.js";
export {
  deriveStatus,
  nextDueDate,
  type Cadence,
  type CommitmentStatus,
} from "./domain/cadence.js";

// Repositories
export {
  PrismaTaskRepository,
  type TaskRepository,
} from "./repositories/task-repository.js";

// Services
export {
  TaskService,
  type CreateTaskInput,
  type TaskWithQuadrant,
} from "./services/task-service.js";

// AI
export {
  type AiProvider,
  type QuadrantClassification,
  NoopAiProvider,
} from "./ai/provider.js";

// Re-export Prisma's generated types so consumers get them without a direct dep.
export type {
  Task,
  Goal,
  MissionStatement,
  Person,
  Commitment,
  CommitmentLog,
  RenewalActivity,
  ApiKey,
  Prisma,
} from "@prisma/client";
