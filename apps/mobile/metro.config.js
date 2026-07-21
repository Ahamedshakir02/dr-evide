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

// Never walk up past the workspace root looking for modules; that path only
// finds surprises on a developer's machine.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
