#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const expoProjectRoot = path.join(projectRoot, 'football-app-expo');
const distDir = path.join(projectRoot, 'dist', 'web');
const firebaseConfigPath = path.join(projectRoot, 'firebase.json');

if (!fs.existsSync(firebaseConfigPath)) {
  console.error('firebase.json is missing. Unable to continue with Firebase Hosting deployment.');
  process.exit(1);
}

// Ensure the export step produced an index.html in the expected location.
const indexHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('No exported web build found in dist/web. Run "npm run deploy:web" first.');
  process.exit(1);
}

const firebaseBinaryName = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
const candidateBinaries = [
  path.join(projectRoot, 'node_modules', '.bin', firebaseBinaryName),
  path.join(expoProjectRoot, 'node_modules', '.bin', firebaseBinaryName),
  firebaseBinaryName,
];

let firebaseBinary = null;
let resolvedViaPath = false;

for (const candidate of candidateBinaries) {
  if (candidate.includes(path.sep)) {
    if (fs.existsSync(candidate)) {
      firebaseBinary = candidate;
      break;
    }
  } else {
    // Last resort: allow resolving via the shell PATH.
    firebaseBinary = candidate;
    resolvedViaPath = true;
    break;
  }
}

if (!firebaseBinary) {
  console.error('Unable to locate the Firebase CLI. Install it with "npm install -g firebase-tools" or add it to the project.');
  process.exit(1);
}

console.log('Deploying dist/web to Firebase Hosting…');

const deployResult = spawnSync(firebaseBinary, ['deploy', '--only', 'hosting'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    FIREBASE_DEPLOY_TOKEN: process.env.FIREBASE_DEPLOY_TOKEN,
  },
  shell: resolvedViaPath,
});

if (deployResult.error) {
  if (deployResult.error.code === 'ENOENT') {
    console.error('Firebase CLI not found on PATH. Install it with "npm install -g firebase-tools" or add it as a dev dependency.');
  } else {
    console.error(`Failed to run Firebase CLI: ${deployResult.error.message}`);
  }
  process.exit(1);
}

if (deployResult.status !== 0) {
  console.error('\nFirebase deployment failed. Review the logs above for details.');
  process.exit(deployResult.status ?? 1);
}

console.log('\nFirebase deployment complete.');
