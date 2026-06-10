import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { ApiKeyService } from "@big-rocks/core";

declare module "fastify" {
  interface FastifyInstance {
    /** Guard for protected routes: requires a valid bearer token. */
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthOptions {
  /** The admin bearer token from the environment. If undefined, dev mode. */
  token: string | undefined;
  /** Verifies generated API keys (agents/services). Optional for tests. */
  apiKeys?: Pick<ApiKeyService, "verify">;
}

/**
 * Token-based auth (single-user model). A request is authorized by either
 * the env admin token (the owner's UI) or a generated, non-revoked API key
 * (agents/services). Routes opt in via the `requireAuth` preHandler so
 * public routes (health, docs) stay open.
 */
export const authPlugin = fp<AuthOptions>(async (fastify, opts) => {
  if (!opts.token) {
    fastify.log.warn(
      "API_AUTH_TOKEN is not set — API routes are OPEN (dev mode). Set it to require a bearer token.",
    );
  }

  fastify.decorate(
    "requireAuth",
    async (req: FastifyRequest, reply: FastifyReply) => {
      // Dev convenience: with no admin token configured, the API is open.
      if (!opts.token) return;
      const header = req.headers.authorization;
      const provided = header?.startsWith("Bearer ")
        ? header.slice("Bearer ".length)
        : undefined;
      if (!provided) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }
      if (provided === opts.token) return;
      if (opts.apiKeys && (await opts.apiKeys.verify(provided))) return;
      reply.code(401).send({ error: "Unauthorized" });
    },
  );
});
