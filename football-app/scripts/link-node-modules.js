const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const expoNodeModules = path.join(projectRoot, 'football-app-expo', 'node_modules');
const targetLink = path.join(projectRoot, 'node_modules');

function ensureExpoModulesExist() {
  if (!fs.existsSync(expoNodeModules)) {
    throw new Error(`Expected Expo dependencies at ${expoNodeModules}, but the directory was not found.`);
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
