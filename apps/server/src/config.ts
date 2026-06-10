/** Server configuration, read once from the environment. */
export interface ServerConfig {
  port: number;
  host: string;
  /** Bearer token required on protected routes. */
  authToken: string | undefined;
  /** Anthropic key for the AI jobs; unset = AI disabled (Noop provider). */
  anthropicApiKey: string | undefined;
  /** Optional Anthropic model override. */
  anthropicModel: string | undefined;
  /** Absolute or relative path to the built frontend, served in production. */
  webDistPath: string | undefined;
  isProduction: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? "0.0.0.0",
    authToken: env.API_AUTH_TOKEN,
    anthropicApiKey: env.ANTHROPIC_API_KEY || undefined,
    anthropicModel: env.ANTHROPIC_MODEL || undefined,
    webDistPath: env.WEB_DIST_PATH,
    isProduction: env.NODE_ENV === "production",
  };
}
