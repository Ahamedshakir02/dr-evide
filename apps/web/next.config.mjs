import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Pin file tracing to the workspace root. Next walks up looking for a
   * lockfile and, on a machine with a stray lockfile in the home directory,
   * picks that instead — which silently traces the wrong tree.
   */
  outputFileTracingRoot: workspaceRoot,

  /**
   * The workspace packages ship TypeScript source rather than a build step, so
   * Next compiles them as part of the app. One less build to keep in sync, and
   * the packages stay debuggable from the app's stack traces.
   */
  transpilePackages: ["@dr-evide/core", "@dr-evide/db"],
};

export default nextConfig;
