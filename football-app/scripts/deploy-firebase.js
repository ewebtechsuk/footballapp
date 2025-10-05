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

for (const candidate of candidateBinaries) {
  if (!candidate.includes(path.sep) || fs.existsSync(candidate)) {
    firebaseBinary = candidate;
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

const deployEnv = {
  ...process.env,
};

let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

if (credentialsPath.trim().startsWith('{')) {
  const firebaseArtifactsDir = path.join(projectRoot, '.firebase');
  const inferredCredentialsPath = path.join(firebaseArtifactsDir, 'service-account.json');

  try {
    fs.mkdirSync(firebaseArtifactsDir, { recursive: true });
    fs.writeFileSync(inferredCredentialsPath, credentialsPath);
  } catch (error) {
    console.error('Failed to write Firebase service account credentials to disk:', error);
    process.exit(1);
  }

  credentialsPath = inferredCredentialsPath;
}

if (!credentialsPath && isCI) {
  console.error(
    'GOOGLE_APPLICATION_CREDENTIALS is not set. Provide a Firebase service account key (store the JSON in the FIREBASE_SERVICE_ACCOUNT_KEY secret) so CI can authenticate before deploying.'
  );
  process.exit(1);
}

if (credentialsPath && !fs.existsSync(credentialsPath)) {
  console.error(`Firebase service account credentials not found at ${credentialsPath}.`);
  console.error('Verify that the FIREBASE_SERVICE_ACCOUNT_KEY secret is configured correctly.');
  process.exit(1);
}

if (credentialsPath) {
  deployEnv.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

const deployArgs = ['deploy', '--only', 'hosting'];

const deployResult = spawnSync(firebaseBinary, deployArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: deployEnv,
});

if (deployResult.error) {
  if (deployResult.error.code === 'ENOENT') {
    simulateDeploy();
  }

  console.error(`Failed to run Firebase CLI: ${deployResult.error.message}`);
  process.exit(1);
}

if (deployResult.status !== 0) {
  console.error('\nFirebase deployment failed. Review the logs above for details.');
  if (credentialsPath) {
    console.error('Confirm that the Firebase service account has Hosting permissions and that the FIREBASE_SERVICE_ACCOUNT_KEY secret is current.');
  }
  process.exit(deployResult.status ?? 1);
}

console.log('\nFirebase deployment complete.');
