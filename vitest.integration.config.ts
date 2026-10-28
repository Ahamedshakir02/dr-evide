import { defineConfig } from "vitest/config";
import base from "./vitest.config";

/**
 * Integration tests: real Postgres + PostGIS, and optionally a real Redis.
 *
 *     TEST_DATABASE_URL=postgres://drevide:drevide@localhost:5432/drevide_test \
 *       npm run test:integration
 *
 * The database is truncated before every test, so the harness refuses any URL
 * whose database name does not contain "test". Files run one at a time because
 * they share that one database.
 */
export default defineConfig({
  // Same aliases as the unit tests (server-only stub, `@/`); only the test set differs.
  resolve: base.resolve,
  test: {
    include: [
      "packages/*/test/integration/**/*.int.test.ts",
      "apps/web/test/integration/**/*.int.test.ts",
      // Database-backed tests that live beside the unit tests.
      "packages/db/test/admin-history.test.ts",
    ],
    environment: "node",
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
