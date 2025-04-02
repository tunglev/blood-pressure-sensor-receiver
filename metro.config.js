// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true
});

// Enable react-native-ble-plx to work properly with Metro
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Allow for handling native modules in the new architecture
config.resolver.blockList = [/..\/node_modules\/react-native\/.*\/node_modules\/fbjs\/.*/];

// Add support for additional file types
config.resolver.assetExts = [...config.resolver.assetExts, 'pem', 'db', 'sqlite'];

module.exports = config; 