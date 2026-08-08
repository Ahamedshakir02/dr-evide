/**
 * Stands in for the `server-only` package under the test runner.
 *
 * `server-only` throws the moment it is imported — that is its whole purpose.
 * Next never hits that, because it resolves the package under the `react-server`
 * export condition, where it points at an empty file. Vitest has no such
 * condition, so `import "server-only"` at the top of llm-routing.ts would fail
 * the suite before a single test ran.
 *
 * Aliased in vitest.config.ts. Empty on purpose: the guard is a build-time
 * boundary, and there is nothing about it to simulate.
 */
export {};
