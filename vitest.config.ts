import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    /**
     * `packages/*` was the whole list until llm-routing.ts got tests. That was
     * not a policy — core is where the logic lives — but it left the one module
     * that parses untrusted model output as the only untested risk in the repo.
     */
    include: ["packages/*/test/**/*.test.ts", "apps/web/test/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: [
      /**
       * `server-only` throws on import by design — that is its entire job. Next
       * resolves it to an empty module under the `react-server` export
       * condition; the test runner has no such condition, so it would throw
       * before a test ran. The package exports only `.`, so its own empty.js
       * cannot be addressed by subpath — hence a stub of ours.
       */
      {
        find: /^server-only$/,
        replacement: path.resolve(root, "apps/web/test/stubs/server-only.ts"),
      },

      /**
       * The trailing slash matters. A bare `@` alias also rewrites the leading
       * character of `@dr-evide/core` and every other scoped package.
       */
      { find: /^@\//, replacement: `${path.resolve(root, "apps/web/src")}/` },
    ],
  },
});
