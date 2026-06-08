/** Typed API client for the BigRocks REST API. */

import { getToken } from "./token";

export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";
export type TaskStatus = "TODO" | "DONE" | "ARCHIVED";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  important: boolean;
  urgent: boolean;
  quadrant: Quadrant;
  status: TaskStatus;
  isBigRock: boolean;
  plannedWeek: string | null;
  dueDate: string | null;
  completedAt: string | null;
  goalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Health {
  status: string;
  uptime: number;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  // Only declare a JSON content-type when we actually send a body — otherwise
  // Fastify rejects the empty body (FST_ERR_CTP_EMPTY_JSON_BODY) on bodyless
  // POST/DELETE calls like complete/reopen/delete.
  if (init?.body !== undefined && init?.body !== null) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...init, headers });
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getHealth(): Promise<Health> {
  return request<Health>("/health");
}

export function listTasks(status?: TaskStatus): Promise<Task[]> {
  return request<Task[]>(`/tasks${status ? `?status=${status}` : ""}`);
}

export interface CreateTaskBody {
  title: string;
  notes?: string;
  important?: boolean;
  urgent?: boolean;
  dueDate?: string;
}

export function createTask(body: CreateTaskBody): Promise<Task> {
  return request<Task>("/tasks", { method: "POST", body: JSON.stringify(body) });
}

export interface UpdateTaskBody {
  title?: string;
  notes?: string | null;
  important?: boolean;
  urgent?: boolean;
  dueDate?: string | null;
  isBigRock?: boolean;
  plannedWeek?: string | null;
}

export function updateTask(id: string, body: UpdateTaskBody): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function completeTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/complete`, { method: "POST" });
}

export function reopenTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/reopen`, { method: "POST" });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: "DELETE" });
}
