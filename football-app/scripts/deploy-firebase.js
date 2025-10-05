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

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const simulateDeploy = () => {
  const firebaseArtifactsDir = path.join(projectRoot, '.firebase');
  const hostingSimDir = path.join(firebaseArtifactsDir, 'hosting-sim');

  console.warn(
    'Firebase CLI not found – creating a simulated hosting output instead. Install firebase-tools locally or globally to perform a real deployment.'
  );

  try {
    fs.rmSync(hostingSimDir, { recursive: true, force: true });
    fs.mkdirSync(hostingSimDir, { recursive: true });
    fs.cpSync(distDir, hostingSimDir, { recursive: true });
  } catch (error) {
    console.error('Failed to generate the simulated hosting output:', error);
    process.exit(1);
  }

  console.log(`Simulated hosting files available at ${hostingSimDir}`);
  process.exit(0);
};

if (!firebaseBinary) {
  simulateDeploy();
}

console.log('Deploying dist/web to Firebase Hosting…');

if (!process.env.FIREBASE_DEPLOY_TOKEN && isCI) {
  console.warn(
    'FIREBASE_DEPLOY_TOKEN was not provided. Skipping the live Firebase Hosting deploy and generating the simulated output instead. Set the FIREBASE_DEPLOY_TOKEN repository secret (firebase login:ci) to enable real deployments from CI.'
  );
  simulateDeploy();
}

const deployEnv = {
  ...process.env,
};

if (process.env.FIREBASE_DEPLOY_TOKEN) {
  deployEnv.FIREBASE_DEPLOY_TOKEN = process.env.FIREBASE_DEPLOY_TOKEN;
}

const deployResult = spawnSync(firebaseBinary, ['deploy', '--only', 'hosting'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: deployEnv,
  shell: resolvedViaPath,
});

if (deployResult.error) {
  if (deployResult.error.code === 'ENOENT') {
    simulateDeploy();
  }

  console.error(`Failed to run Firebase CLI: ${deployResult.error.message}`);
  process.exit(1);
}

if (deployResult.status === 127 && resolvedViaPath) {
  simulateDeploy();
}

if (deployResult.status !== 0) {
  console.error('\nFirebase deployment failed. Review the logs above for details.');
  if (process.env.FIREBASE_DEPLOY_TOKEN) {
    console.error('Ensure the FIREBASE_DEPLOY_TOKEN secret is valid (regenerate with "firebase login:ci" if necessary).');
  }
  process.exit(deployResult.status ?? 1);
}

console.log('\nFirebase deployment complete.');
