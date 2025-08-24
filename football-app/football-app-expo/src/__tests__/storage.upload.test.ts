import { uploadAvatar } from '../services/storage';

// Mock firebase/storage functions used by uploadAvatar
jest.mock('firebase/storage', () => {
  return {
    ref: jest.fn((storageObj: any, path: string) => ({ storageObj, path })),
    uploadBytesResumable: jest.fn((ref: any, file: any) => {
      // return a fake upload task with an `on` method
      return {
        on: (_event: string, next: (snap: any) => void, _err: (e: any) => void, complete: () => void) => {
          // simulate two progress updates then completion
          setTimeout(() => next({ bytesTransferred: 50, totalBytes: 100 }), 10);
          setTimeout(() => next({ bytesTransferred: 100, totalBytes: 100 }), 20);
          setTimeout(() => complete(), 30);
          return () => {};
        },
      };
    }),
    getDownloadURL: jest.fn(async (ref: any) => 'https://example.com/avatar.jpg'),
  };
});

// Mock local firebase export (storage object)
jest.mock('../services/firebase', () => ({ storage: {} }));

describe('uploadAvatar', () => {
  it('calls onProgress and returns download URL', async () => {
    const progressCalls: number[] = [];
    const onProgress = (p: number) => progressCalls.push(p);

    const url = await uploadAvatar('user1', new Blob(['a']), onProgress);

    expect(url).toBe('https://example.com/avatar.jpg');
    // because we simulate 50 then 100, ensure progress was reported
    expect(progressCalls.length).toBeGreaterThanOrEqual(2);
    expect(progressCalls).toContain(50);
    expect(progressCalls).toContain(100);
  });

  it('rejects when upload errors', async () => {
    // override the mock to call error callback
    const mod = require('firebase/storage');
    (mod.uploadBytesResumable as jest.Mock).mockImplementationOnce(() => ({
      on: (_event: string, _next: any, err: (e: any) => void) => {
        setTimeout(() => err(new Error('upload failed')), 5);
        return () => {};
      },
    }));

    await expect(uploadAvatar('user1', new Blob(['a']), undefined)).rejects.toThrow('upload failed');
  });
});
