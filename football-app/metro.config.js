const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const linkedNodeModules = path.join(projectRoot, 'node_modules');

const optionalShims = [
  {
    name: '@react-native-async-storage/async-storage',
    shim: path.join(projectRoot, 'src', 'shims', 'async-storage'),
  },
  {
    name: 'react-native-google-mobile-ads',
    shim: path.join(projectRoot, 'src', 'shims', 'react-native-google-mobile-ads'),
  },
  {
    name: 'react-native-iap',
    shim: path.join(projectRoot, 'src', 'shims', 'react-native-iap'),
  },
];

const missingShims = optionalShims.filter(({ name }) => {
  const modulePath = path.join(linkedNodeModules, ...name.split('/'));
  return !fs.existsSync(modulePath);
});

if (missingShims.length > 0) {
  config.resolver = config.resolver || {};
  const shimMap = missingShims.reduce((acc, { name, shim }) => {
    acc[name] = shim;
    return acc;
  }, {});

  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    ...shimMap,
  };
}

module.exports = config;
