import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  target: "node20",
  // Bundle the workspace core (it exports TypeScript source) into the output so
  // the server image is self-contained. Keep node_modules deps external.
  noExternal: ["@big-rocks/core"],
  skipNodeModulesBundle: true,
});
