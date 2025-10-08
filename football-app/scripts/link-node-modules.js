const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const expoProjectRoot = path.join(projectRoot, 'football-app-expo');
const expoNodeModules = path.join(projectRoot, 'football-app-expo', 'node_modules');
const targetLink = path.join(projectRoot, 'node_modules');

const REQUIRED_PACKAGES = [
  '@react-navigation/bottom-tabs',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@react-navigation/elements',
  '@reduxjs/toolkit',
];

function ensureExpoModulesExist() {
  const missingPackages = [];

  for (const pkg of REQUIRED_PACKAGES) {
    const candidatePath = path.join(expoNodeModules, ...pkg.split('/'));
    if (!fs.existsSync(candidatePath)) {
      missingPackages.push(pkg);
    }
  }

  if (missingPackages.length === 0) {
    return;
  }

  console.log('Installing Expo workspace dependencies…');

  const result = spawnSync('npm', ['install'], {
    cwd: expoProjectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_loglevel: process.env.npm_config_loglevel ?? 'error',
    },
  });

  if (result.status !== 0) {
    throw new Error('Failed to install Expo workspace dependencies.');
  }

  const stillMissing = missingPackages.filter((pkg) => {
    const candidatePath = path.join(expoNodeModules, ...pkg.split('/'));
    return !fs.existsSync(candidatePath);
  });

  if (stillMissing.length) {
    throw new Error(
      `Expo workspace dependencies missing after install: ${stillMissing.join(', ')}`,
    );
  }
}

function linkNodeModules() {
  const linkExists = fs.existsSync(targetLink);

  if (linkExists) {
    const stats = fs.lstatSync(targetLink);

    if (stats.isSymbolicLink()) {
      const currentTarget = fs.realpathSync(targetLink);
      if (path.normalize(currentTarget) === path.normalize(expoNodeModules)) {
        console.log('node_modules already linked to football-app-expo.');
        return;
      }
    }

    console.log('Removing existing node_modules so it can be re-linked.');
    fs.rmSync(targetLink, { recursive: true, force: true });
  }

  try {
    fs.symlinkSync(expoNodeModules, targetLink, 'dir');
    console.log('Created symlink from node_modules to football-app-expo/node_modules.');
  } catch (error) {
    console.warn('Symlink failed, copying dependencies instead. This may take a while.');
    fs.cpSync(expoNodeModules, targetLink, { recursive: true });
    console.log('Copied football-app-expo/node_modules into project node_modules.');
  }
}

try {
  ensureExpoModulesExist();
  linkNodeModules();
} catch (error) {
  console.error(`Failed to prepare node_modules: ${error.message}`);
  process.exit(1);
}
