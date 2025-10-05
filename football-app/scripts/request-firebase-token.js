#!/usr/bin/env node
'use strict';

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const workspaceRoot = path.resolve(__dirname, '..');
const defaultEnvFile = path.join(workspaceRoot, '.env.local');
const args = process.argv.slice(2);
const shouldSaveToken = args.includes('--save');
const envPathArgument = args.find((arg) => arg.startsWith('--env='));
const envFilePath = envPathArgument
  ? path.resolve(workspaceRoot, envPathArgument.split('=')[1])
  : defaultEnvFile;
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
  console.error('\nOptional helpers:');
  console.error('  npm run firebase:token -- --save       # prompt to store the token in .env.local');
  console.error('  npm run firebase:token -- --env=.env   # pick a custom env file when saving');
}

function ensureTrailingNewline(value) {
  return value.endsWith('\n') ? value : `${value}\n`;
}

function upsertEnvValue(filePath, key, value) {
  let content = '';

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  }

  const line = `${key}=${value}`;
  const envPattern = new RegExp(`^${key}=.*$`, 'm');

  if (envPattern.test(content)) {
    content = content.replace(envPattern, line);
  } else {
    if (content.length > 0 && !content.endsWith('\n')) {
      content = ensureTrailingNewline(content);
    }
    content += ensureTrailingNewline(line);
  }

  fs.writeFileSync(filePath, content);
}

async function promptToPersistToken(filePath) {
  if (!process.stdin.isTTY) {
    console.warn('\nCannot capture token automatically because the terminal is not interactive.');
    console.warn(`Add FIREBASE_DEPLOY_TOKEN to ${filePath} manually.`);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const token = await new Promise((resolve) => {
    rl.question('\nPaste the deploy token printed above to store it locally: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.warn('No token entered. Skipping save.');
    return;
  }

  upsertEnvValue(filePath, 'FIREBASE_DEPLOY_TOKEN', token);

  console.log(`Saved FIREBASE_DEPLOY_TOKEN to ${filePath}.`);
  console.log('Commit this file only if you intend to share the token (typically it should remain untracked).');
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

  child.on('exit', async (code) => {
    if (code === 0) {
      console.log('\nFirebase CLI finished. Paste the token into your secrets or `.env` file.');
      if (shouldSaveToken) {
        try {
          await promptToPersistToken(envFilePath);
        } catch (error) {
          console.error(`Failed to store the deploy token in ${envFilePath}:`, error);
          process.exitCode = 1;
          return;
        }
      }
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
