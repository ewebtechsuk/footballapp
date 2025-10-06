const fs = require('fs');

function fail(message) {
  console.log(`::error::${message}`);
  process.exit(1);
}

const path = process.env.CREDENTIALS_PATH;
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_RAW || '';
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || '';

if (!path) {
  fail('CREDENTIALS_PATH is not defined.');
}

let content = raw.trim();

if (!content) {
  const normalised = b64.replace(/\s+/g, '');

  if (!normalised) {
    fail('Firebase service account secret is empty. Provide FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_BASE64.');
  }

  if (!/^[A-Za-z0-9+/=_-]+$/.test(normalised)) {
    fail('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not valid base64 data.');
  }

  try {
    let decodeSource = normalised.replace(/-/g, '+').replace(/_/g, '/');

    if (decodeSource.length % 4 !== 0) {
      decodeSource = decodeSource.padEnd(decodeSource.length + (4 - (decodeSource.length % 4)), '=');
    }

    const decoded = Buffer.from(decodeSource, 'base64');
    const reencoded = decoded.toString('base64').replace(/=+$/, '');
    const expected = decodeSource.replace(/=+$/, '');

    if (!decoded.length || reencoded !== expected) {
      throw new Error('Decoded content is empty or corrupted.');
    }

    content = decoded.toString('utf8');
  } catch (error) {
    fail(`Failed to decode FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: ${error.message}`);
  }
}

const trimmed = content.trim();

if (!trimmed) {
  fail('Firebase service account key is empty after decoding.');
}

let parsed;
try {
  parsed = JSON.parse(trimmed);
} catch (error) {
  fail(`Firebase service account key is not valid JSON: ${error.message}`);
}

if (!parsed || parsed.type !== 'service_account') {
  fail('Firebase credential must be a service account JSON key (type "service_account").');
}

if (!parsed.project_id) {
  fail('Firebase service account JSON is missing "project_id".');
}

try {
  fs.writeFileSync(path, trimmed, { encoding: 'utf8', mode: 0o600 });
} catch (error) {
  fail(`Failed to write credentials file: ${error.message}`);
}

module.exports = parsed;
