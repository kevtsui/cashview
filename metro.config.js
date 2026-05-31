// metro.config.js
// On web, Metro still tries to parse PlaidLinkButton.tsx (the native file)
// during its dependency scan, causing react-native-plaid-link-sdk to crash
// because its dist/PlaidLink module doesn't exist in a Node.js context.
// The resolveRequest override below returns an empty stub for that package
// on web — the real PlaidLinkButton.web.tsx uses react-plaid-link instead.

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

// Modules that don't resolve cleanly on web and need empty stubs
const WEB_STUBS = new Set([
  "react-native-plaid-link-sdk", // uses react-plaid-link on web instead
  "@opentelemetry/api",          // supabase-js peer dep, not needed on web
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_STUBS.has(moduleName)) {
    return { type: "empty" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
