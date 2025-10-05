// Firebase initialization (modular SDK)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
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
  apiKey: process.env.FIREBASE_API_KEY || extras.FIREBASE_API_KEY || 'AIzaSyDNYE3TgTsKJ68EzJfe1nASv8iS17UJ_kY',
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || extras.FIREBASE_AUTH_DOMAIN || 'footballapp-90e32.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || extras.FIREBASE_PROJECT_ID || 'footballapp-90e32',
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || extras.FIREBASE_STORAGE_BUCKET || 'footballapp-90e32.firebasestorage.app',
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID || extras.FIREBASE_MESSAGING_SENDER_ID || '607732579377',
  appId: process.env.FIREBASE_APP_ID || extras.FIREBASE_APP_ID || '1:607732579377:web:b2bc03baeda0b0627ea910',
  measurementId:
    process.env.FIREBASE_MEASUREMENT_ID ||
    extras.FIREBASE_MEASUREMENT_ID ||
    'G-G5073H160W'
};

// Fail fast if any config values are still missing after applying fallbacks.
const missingKeys = Object.entries(firebaseConfig).filter(([, v]) => !v);
if (missingKeys.length > 0) {
  const keys = missingKeys.map(([k]) => k).join(', ');
  throw new Error(`Missing Firebase configuration: ${keys}. Check src/services/firebase.ts.`);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase Analytics is only available on supported platforms (e.g., web).
// Expose a promise so callers can await analytics when supported without
// causing runtime errors on native builds.
export const analytics = isAnalyticsSupported()
  .then((supported) => (supported ? getAnalytics(app) : undefined))
  .catch(() => undefined);

export default app;
