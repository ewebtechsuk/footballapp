const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const loadEnv = require('./load-env');

loadEnv();

const projectRoot = path.resolve(__dirname, '..');
const expoProjectRoot = path.join(projectRoot, 'football-app-expo');
const expoBinaryName = process.platform === 'win32' ? 'expo.cmd' : 'expo';
const candidateBinaries = [
  path.join(projectRoot, 'node_modules', '.bin', expoBinaryName),
  path.join(expoProjectRoot, 'node_modules', '.bin', expoBinaryName),
  expoBinaryName,
];

let expoBinary = null;
let resolvedViaPath = false;

for (const candidate of candidateBinaries) {
  if (candidate.includes(path.sep)) {
    if (fs.existsSync(candidate)) {
      expoBinary = candidate;
      break;
    }
  } else {
    expoBinary = candidate;
    resolvedViaPath = true;
    break;
  }
}

if (!expoBinary) {
  console.error(
    'Unable to locate the Expo CLI. Run "npm install" to ensure the vendored workspace is linked or install expo globally.'
  );
  process.exit(1);
}

const projectOutputRoot = path.join(projectRoot, 'dist', 'web');

console.log('Preparing Expo web preview build…');

fs.rmSync(projectOutputRoot, { recursive: true, force: true });
fs.mkdirSync(projectOutputRoot, { recursive: true });

const result = spawnSync(
  expoBinary,
  ['export', '--platform', 'web', '--output-dir', projectOutputRoot],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_TELEMETRY: '1',
    },
    shell: resolvedViaPath,
  }
);

if (result.status !== 0) {
  console.error('\nExpo export failed. Check the logs above for details.');
  process.exit(result.status ?? 1);
}

console.log(`\nExpo web preview exported to ${projectOutputRoot}`);
console.log('You can serve the preview locally with "npm run preview:web".');
