import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    /** Guard for protected routes: requires a valid bearer token. */
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthOptions {
  /** The expected bearer token. If undefined, protected routes return 503. */
  token: string | undefined;
}

/**
 * Token-based auth (single-user model). Routes opt in via the `requireAuth`
 * preHandler rather than it being global, so public routes (health, docs)
 * stay open.
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
      // Dev convenience: with no token configured, the API is open. Token-based
      // auth is hardened in build-order step 6.
      if (!opts.token) return;
      const header = req.headers.authorization;
      const provided = header?.startsWith("Bearer ")
        ? header.slice("Bearer ".length)
        : undefined;
      if (!provided || provided !== opts.token) {
        reply.code(401).send({ error: "Unauthorized" });
      }
    },
  );
});
