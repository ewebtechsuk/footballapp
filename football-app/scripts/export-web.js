const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const expoProjectRoot = path.join(projectRoot, 'football-app-expo');
const expoBinary = process.platform === 'win32'
  ? path.join(expoProjectRoot, 'node_modules', '.bin', 'expo.cmd')
  : path.join(expoProjectRoot, 'node_modules', '.bin', 'expo');
const outputRoot = path.join(projectRoot, 'dist', 'web');

if (!fs.existsSync(expoBinary)) {
  console.error(
    `Unable to find the Expo CLI at "${expoBinary}". Ensure the vendored workspace is intact by running \"npm run link:modules\" first.`
  );
  process.exit(1);
}

console.log('Preparing Expo web preview build…');

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

const result = spawnSync(
  expoBinary,
  ['export', '--platform', 'web', '--output-dir', outputRoot],
  {
    cwd: expoProjectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_TELEMETRY: '1',
    },
  }
);

if (result.status !== 0) {
  console.error('\nExpo export failed. Check the logs above for details.');
  process.exit(result.status ?? 1);
}

console.log(`\nExpo web preview exported to ${outputRoot}`);
console.log('You can serve the preview locally with "npm run preview:web".');
