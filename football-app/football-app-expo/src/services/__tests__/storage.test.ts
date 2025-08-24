// Mock expo-constants to prevent Jest from loading the real ESM module from node_modules
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    manifest: {},
    expoConfig: {},
  },
}));

import { uploadAvatar } from '../storage';

// Mock the firebase/storage functions used by storage.ts
jest.mock('firebase/storage', () => {
  return {
  getStorage: jest.fn(() => ({})),
    ref: jest.fn((storage: any, path: string) => ({ path })),
    uploadBytesResumable: jest.fn((ref: any, file: any, metadata: any) => {
      // return an object with `on` that calls progress then complete
      return {
        on: (event: string, progressCb: any, errCb: any, completeCb: any) => {
          // simulate a small progress then completion
          const snapshot = { bytesTransferred: 50, totalBytes: 100 };
          setTimeout(() => progressCb(snapshot), 0);
          setTimeout(() => completeCb(), 0);
          return () => {
            // unsubscribe noop
          };
        },
      };
    }),
    getDownloadURL: jest.fn(async (ref: any) => `https://storage.example/${ref.path}`),
  };
});

// Mock other firebase modules used during initialization
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'dev-uid' } })),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));

describe('uploadAvatar smoke', () => {
  it('returns an object with url/path', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    const { promise, cancel } = uploadAvatar('dev-uid', blob, (pct) => {
      // progress callback should be called
      expect(typeof pct).toBe('number');
    });

    const res = await promise;
    expect(res.url).toContain('https://storage.example/');
    expect(res.path).toBeDefined();
    expect(cancel).toBeInstanceOf(Function);
  });
});
