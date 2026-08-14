// Metro must watch the repo-root `tokens/` folder so the RN app can import the
// auto-generated tokens/tokens.ts (the single source of truth) which lives
// outside this Expo project root. Source of truth: tokens/jds.tokens.json.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const tokensRoot = path.resolve(projectRoot, '../../tokens');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [tokensRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

module.exports = config;
