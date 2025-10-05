#!/usr/bin/env node
'use strict';

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const localBinary = path.join(
  workspaceRoot,
  'node_modules',
  '.bin',
  isWindows ? 'firebase.cmd' : 'firebase'
);

const globalBinary = isWindows ? 'firebase.cmd' : 'firebase';

function hasBinary(candidate) {
  if (!candidate) return false;

  if (candidate === globalBinary) {
    const result = spawnSync(candidate, ['--version'], {
      stdio: 'ignore'
    });
    return result.status === 0;
  }

  try {
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function resolveFirebaseCli() {
  if (hasBinary(localBinary)) {
    return { command: localBinary, label: 'local firebase-tools binary' };
  }

  if (hasBinary(globalBinary)) {
    return { command: globalBinary, label: 'global firebase-tools binary' };
  }

  return null;
}

function printSetupHelp() {
  const installCommand = isWindows
    ? 'npm install -g firebase-tools'
    : 'npm install -g firebase-tools';

  console.error('\nFirebase CLI not found.');
  console.error('Install it with:');
  console.error(`  ${installCommand}`);
  console.error('\nOnce installed, rerun:');
  console.error('  npm run firebase:token');
  console.error('\nThis helper simply wraps `firebase login:ci` so you can copy the generated token');
  console.error('into the FIREBASE_DEPLOY_TOKEN secret (or your local environment variable).');
}

function runLogin(command) {
  console.log(`Using ${command.label}.`);
  console.log('Running `firebase login:ci` — follow the prompts in your browser to authenticate.');
  console.log('When the CLI prints a token, copy it and store it as FIREBASE_DEPLOY_TOKEN.');
  console.log('Press Ctrl+C to cancel.\n');

  const child = spawn(command.command, ['login:ci'], {
    stdio: 'inherit',
    env: process.env,
    cwd: workspaceRoot
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\nFirebase CLI finished. Paste the token into your secrets or `.env` file.');
    } else {
      console.error(`\nFirebase CLI exited with status ${code}.`);
      console.error('If the browser window closed early, rerun the command.');
    }
  });
}

function main() {
  const command = resolveFirebaseCli();

  if (!command) {
    printSetupHelp();
    process.exitCode = 1;
    return;
  }

  runLogin(command);
}

main();
