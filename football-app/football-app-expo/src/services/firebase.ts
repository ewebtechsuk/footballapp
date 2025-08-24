// Firebase initialization (modular SDK)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// In local development, load environment variables from a .env file if present.
// Use a safe require so this doesn't crash in environments without dotenv.
if (process.env.NODE_ENV !== 'production') {
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    dotenv.config();
  } catch (e) {
    // Ignore if dotenv isn't installed in constrained environments.
  }
}

// TODO: replace these with your real Firebase config values or use env vars
// Prefer Expo Constants.extras (works for web and native when set in app.json or app.config.js)
const extras = (Constants && (Constants.expoConfig?.extra || Constants.manifest?.extra)) || {};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || extras.FIREBASE_API_KEY || '<YOUR_API_KEY>',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || extras.FIREBASE_AUTH_DOMAIN || '<YOUR_AUTH_DOMAIN>',
  projectId: process.env.FIREBASE_PROJECT_ID || extras.FIREBASE_PROJECT_ID || '<YOUR_PROJECT_ID>',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || extras.FIREBASE_STORAGE_BUCKET || '<YOUR_STORAGE_BUCKET>',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || extras.FIREBASE_MESSAGING_SENDER_ID || '<YOUR_MESSAGING_SENDER_ID>',
  appId: process.env.FIREBASE_APP_ID || extras.FIREBASE_APP_ID || '<YOUR_APP_ID>'
};

// Fail fast when the config still contains placeholders to avoid malformed
// network requests to Firestore (which show up as repeated 400 errors).
const placeholderKeys = Object.entries(firebaseConfig).filter(([, v]) =>
  typeof v === 'string' && v.startsWith('<') && v.endsWith('>')
);
if (placeholderKeys.length > 0) {
  // Log a helpful message that lists which keys are missing; throw to stop
  // the app from continuing to hit the Firestore WebChannel with bad params.
  const keys = placeholderKeys.map(([k]) => k).join(', ');
  // eslint-disable-next-line no-console
  console.error(
    `Firebase config appears to be missing real values for: ${keys}.\n` +
      'Set the values in environment variables or replace the placeholders in src/services/firebase.ts'
  );
  throw new Error(
    `Missing Firebase configuration: ${keys}. See src/services/firebase.ts to set them.`
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
