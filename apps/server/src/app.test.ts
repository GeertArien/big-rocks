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

  it("gates the role and project routes behind auth", async () => {
    for (const url of ["/api/roles", "/api/projects"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(401);
    }
  });

  it("documents the role and project routes in the OpenAPI spec", async () => {
    const res = await app.inject({ method: "GET", url: "/docs/json" });
    const paths = Object.keys(res.json().paths as Record<string, unknown>);
    expect(paths).toContain("/api/roles");
    expect(paths).toContain("/api/projects");
  });

  it("rejects protected routes with a wrong token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/tasks",
      headers: { authorization: "Bearer nope" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("accepts an empty body on application/json POSTs (no FST_ERR_CTP_EMPTY_JSON_BODY)", async () => {
    // A bodyless POST with a JSON content-type used to 400 before reaching auth.
    // Now the empty body is parsed as undefined, so the request reaches the auth
    // gate and returns 401 (not 400) when unauthenticated.
    const res = await app.inject({
      method: "POST",
      url: "/api/tasks/abc/complete",
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(401);
  });
});
