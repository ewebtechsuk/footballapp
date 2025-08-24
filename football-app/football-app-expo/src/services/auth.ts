import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import devAuth, { setDevUser, getDevUser, clearDevUser } from './devAuth';

// NOTE: These dev test credentials are only used when running locally and are
// intentionally gated behind an environment variable to avoid accidental use in
// production. To enable, set DEV_AUTH=true or EXPO_DEV_AUTH=true in your
// environment prior to starting the app.
const DEV_EMAIL = 'ewebtechs@gmail.com';
const DEV_PW = 'Luqman786';
// Enable dev auth when running in a development/devtools environment. Expo sets
// global.__DEV__ in dev mode, so prefer that. Also allow explicit env vars.
const ENABLE_DEV = (typeof global !== 'undefined' && (global as any).__DEV__) ||
  process.env.DEV_AUTH === 'true' || process.env.EXPO_DEV_AUTH === 'true';

export const signup = async (email: string, password: string): Promise<User | any> => {
  // For development, treat signup as a no-op and return a mock user when using the dev credentials.
  if (ENABLE_DEV && email === DEV_EMAIL && password === DEV_PW) {
    const u = { uid: 'dev-ewebtechs', email };
    setDevUser(u as any);
    return u as any;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const login = async (email: string, password: string): Promise<User | any> => {
  // Accept the dev credentials locally and set a mock user.
  if (ENABLE_DEV && email === DEV_EMAIL && password === DEV_PW) {
    const u = { uid: 'dev-ewebtechs', email };
    setDevUser(u as any);
    return u as any;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  // Clear dev user if set, otherwise sign out of Firebase.
  if (getDevUser()) {
    clearDevUser();
    return;
  }
  await signOut(auth);
};

export const getLocalDevUser = () => getDevUser();

// For convenience during local development, this will set the dev user when
// running in a dev environment (global.__DEV__) or when explicit dev env vars
// are present. Call from app startup to auto-enable the dev user for testing.
export const ensureDevUser = () => {
  try {
    const has = getDevUser();
    if (!has && ENABLE_DEV) {
      // set the well-known dev user used elsewhere in the app
      setDevUser({ uid: 'dev-ewebtechs', email: DEV_EMAIL } as any);
    }
  } catch (e) {
    // ignore; best-effort only
    // eslint-disable-next-line no-console
    console.warn('ensureDevUser failed', e);
  }
};
