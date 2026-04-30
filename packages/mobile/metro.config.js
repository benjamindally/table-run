const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.unstable_enableSymlinks = true;

// pnpm stores expo in a deep virtual store, so expo/AppEntry.js's relative
// "../../App" import can't reach the project root. Intercept and redirect it.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    context.originModulePath.includes("expo/AppEntry") &&
    moduleName === "../../App"
  ) {
    return {
      type: "sourceFile",
      filePath: path.resolve(projectRoot, "App.tsx"),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
