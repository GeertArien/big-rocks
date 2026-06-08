import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

const app = await buildApp({ config });

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
