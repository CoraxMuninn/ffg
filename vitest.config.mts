import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration — the project's maintained TypeScript test runner
 * (audit SEC-M7 / ARCH-M1, Roadmap Task 2.1).
 *
 * The security and API regression suites are pure server logic, so they run in
 * a Node environment with no browser DOM. The `@/` path alias is mirrored from
 * `tsconfig.json` so the suites import the real modules under test rather than
 * transcribed copies of their logic.
 *
 * Run with:  npm test        (single run, CI-friendly)
 *            npx vitest      (watch during development)
 *
 * `.mts` so Vite loads the config as ESM (avoids the CJS Node-API deprecation
 * warning) and so `import.meta.url` resolves the alias portably.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    pool: "forks",
  },
});
