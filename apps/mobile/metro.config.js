// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * Metro defaults to watching only the app directory, which is wrong in a
 * workspace: @dr-evide/core is a symlink out to packages/core, and without this
 * an edit to TrustScore would not trigger a reload — or worse, would resolve to
 * a stale copy.
 */
config.watchFolders = [workspaceRoot];

// Resolve from the app first, then the hoisted workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Hierarchical lookup is deliberately left enabled (the Expo default).
// Disabling it is older monorepo advice that predates npm hoisting: with a
// hoisted tree, Metro still needs to walk up to find transitive dependencies
// that live in neither of the two paths above. `npx expo-doctor` flags the
// override for exactly this reason.

module.exports = config;
