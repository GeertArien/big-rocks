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
export {
  PrismaGoalRepository,
  type GoalRepository,
  type GoalWithTasks,
} from "./repositories/goal-repository.js";
export {
  PrismaMissionRepository,
  type MissionRepository,
} from "./repositories/mission-repository.js";

// Services
export {
  TaskService,
  groupByQuadrant,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilter,
  type TaskWithQuadrant,
} from "./services/task-service.js";
export {
  GoalService,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalProgress,
  type GoalWithProgress,
} from "./services/goal-service.js";
export { MissionService } from "./services/mission-service.js";

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
  GoalStatus,
  MissionStatement,
  Person,
  Commitment,
  CommitmentLog,
  RenewalActivity,
  ProactivityTag,
  ApiKey,
  Prisma,
} from "@prisma/client";
