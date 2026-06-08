import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

/**
 * App-level tests using Fastify's `inject` — no network, no real database calls
 * (these routes don't hit the DB). Verifies wiring: health, docs, and auth gate.
 */
describe("server app", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      config: { ...loadConfig(), authToken: "test-token", isProduction: false },
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("responds to the health check", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });

  it("serves an OpenAPI document", async () => {
    const res = await app.inject({ method: "GET", url: "/docs/json" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ openapi: expect.any(String) });
  });

  it("rejects protected routes without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/tasks" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects protected routes with a wrong token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/tasks",
      headers: { authorization: "Bearer nope" },
    });
    expect(res.statusCode).toBe(401);
  });
});
