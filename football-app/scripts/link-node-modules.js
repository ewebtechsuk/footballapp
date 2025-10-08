const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const expoProjectRoot = path.join(projectRoot, 'football-app-expo');
const expoNodeModules = path.join(expoProjectRoot, 'node_modules');
const packageJsonPath = path.join(projectRoot, 'package.json');
const expoPackageJsonPath = path.join(expoProjectRoot, 'package.json');
const targetLink = path.join(projectRoot, 'node_modules');

function installExpoDependencies(reason) {
  console.log(`${reason}\nInstalling Expo workspace dependencies…`);

  const { spawnSync } = require('child_process');
  const result = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: expoProjectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to install Expo workspace dependencies (exit code ${result.status ?? 'unknown'}).`);
  }
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to read ${filePath}: ${error.message}`);
  }
}

function listExpectedModules() {
  const packageJson = readJson(packageJsonPath);
  const expoPackageJson = readJson(expoPackageJsonPath);

  const optionalShims = new Set(packageJson.optionalShims || []);
  const expected = new Set([
    ...(packageJson.localDependencies || []),
    ...Object.keys(packageJson.vendoredDependencies || {}),
    ...Object.keys(expoPackageJson.dependencies || {}),
  ]);

  // Some dependencies are intentionally shimmed for web/testing and are not
  // expected to be installed in the Expo workspace. Allow the package.json to
  // declare them via an optionalShims array so they do not trigger unnecessary
  // installs during automation.
  optionalShims.forEach((name) => expected.delete(name));

  return Array.from(expected);
}

function ensureExpoModulesExist() {
  if (!fs.existsSync(expoNodeModules)) {
    installExpoDependencies(`Expected Expo dependencies at ${expoNodeModules}, but the directory was not found.`);
  }

  const missingModules = () =>
    listExpectedModules().filter((name) => {
      const modulePath = path.join(expoNodeModules, ...name.split('/'));
      return !fs.existsSync(modulePath);
    });

  let missing = missingModules();

  if (missing.length > 0) {
    installExpoDependencies(
      `Missing Expo dependencies detected (${missing.join(', ')}).`
    );
    missing = missingModules();
  }

  if (missing.length > 0) {
    throw new Error(
      `Expo dependencies are still missing after installation: ${missing.join(', ')}`
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
