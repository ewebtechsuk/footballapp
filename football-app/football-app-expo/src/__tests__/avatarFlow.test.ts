import { uploadUserAvatar } from '../services/avatarFlow';
import * as storage from '../services/storage';
import * as firestore from '../services/firestore';

jest.mock('../services/storage');
jest.mock('../services/firestore');

describe('uploadUserAvatar', () => {
  it('reports progress and calls updateUserProfile', async () => {
    const progressCalls: number[] = [];
    (storage.uploadAvatar as jest.Mock).mockImplementation(async (_userId: string, _file: any, onProgress?: (p: number) => void) => {
      if (onProgress) {
        onProgress(25);
        onProgress(75);
        onProgress(100);
      }
      return 'https://example.com/avatar2.jpg';
    });
    (firestore.updateUserProfile as jest.Mock).mockResolvedValue(undefined);

    const onStart = jest.fn();
    const onFinish = jest.fn();
    const onError = jest.fn();

    const url = await uploadUserAvatar('u1', new Blob(['a']), false, {
      onStart,
      onProgress: (p) => progressCalls.push(p),
      onFinish,
      onError,
    });

    expect(url).toBe('https://example.com/avatar2.jpg');
    expect(onStart).toHaveBeenCalled();
    expect(progressCalls).toEqual([25, 75, 100]);
    expect(onFinish).toHaveBeenCalledWith('https://example.com/avatar2.jpg');
    expect(firestore.updateUserProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ avatarUrl: 'https://example.com/avatar2.jpg' }));
  });

  it('propagates errors and calls onError', async () => {
    (storage.uploadAvatar as jest.Mock).mockRejectedValue(new Error('boom'));
    const onError = jest.fn();
    await expect(uploadUserAvatar('u1', new Blob(['a']), false, { onError })).rejects.toThrow('boom');
    expect(onError).toHaveBeenCalled();
  });
});
