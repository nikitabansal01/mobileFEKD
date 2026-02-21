module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo"
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
      'transform-inline-environment-variables',
      'react-native-worklets/plugin', // Must be last!
    ],
  };
}; 