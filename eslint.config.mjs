import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Flat config for the whole workspace.
 *
 * Deliberately close to the recommended sets. The heavy lifting is done by
 * `tsc --noEmit` across all four workspaces and by the test suite; lint is here
 * to catch what types don't — unused bindings, accidental `any`, and stale
 * React hook dependencies.
 *
 * `eslint-config-next` is intentionally absent: it pulls @rushstack/eslint-patch,
 * which fails to load under ESLint 9.39. Its genuinely useful rule is
 * react-hooks/exhaustive-deps, which is included directly below.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.expo/**",
      "**/dist/**",
      "**/build/**",
      "**/next-env.d.ts",
      "dr-evide-doctor-discovery/**", // design handoff bundle — reference, not source
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Unused function args are often deliberate in route handlers (`_req`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Empty catch blocks are load-bearing here: routing and the mobile API
      // layer swallow failures on purpose and fall back rather than surfacing an
      // error, and the caught value is never logged because it can contain the
      // user's symptom text.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  {
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
  },

  // metro.config.js must stay CommonJS — Expo's Metro loads it with require().
  {
    files: ["**/metro.config.js", "**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node, __dirname: "readonly" },
    },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  }
);
