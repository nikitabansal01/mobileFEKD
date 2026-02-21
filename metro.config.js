const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('lottie');
config.resolver.sourceExts.push('svg');

module.exports = config;
