import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { loadConfig, type ServerConfig } from "./config.js";
import { authPlugin } from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { taskRoutes } from "./routes/tasks.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface BuildAppOptions {
  config?: ServerConfig;
}

/**
 * Builds the Fastify instance without starting it — so tests can drive it via
 * `app.inject(...)` and the entry point can `listen()`.
 */
export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const app = Fastify({ logger: !config.isProduction });

  // OpenAPI/Swagger so other agents/services can discover the API.
  await app.register(fastifySwagger, {
    openapi: {
      info: { title: "BigRocks API", version: "0.0.0" },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer" },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: "/docs" });

  await app.register(authPlugin, { token: config.authToken });

  // API routes under /api.
  await app.register(
    async (api) => {
      await healthRoutes(api);
      await taskRoutes(api);
    },
    { prefix: "/api" },
  );

  // In production, serve the built frontend as static files (single container).
  const webDist = config.webDistPath
    ? resolve(config.webDistPath)
    : join(__dirname, "..", "..", "web", "dist");
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist });
    // SPA fallback: serve index.html for non-API routes.
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api")) {
        reply.code(404).send({ error: "Not found" });
        return;
      }
      reply.sendFile("index.html");
    });
  }

  return app;
}
