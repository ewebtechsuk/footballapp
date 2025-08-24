import { uploadAvatar } from './storage';
import { updateUserProfile } from './firestore';

export type AvatarFlowCallbacks = {
  onStart?: () => void;
  onProgress?: (pct: number) => void;
  onFinish?: (url: string) => void;
  onError?: (err: Error) => void;
};

// fileOrUri: File/Blob or string uri; isUri indicates whether to fetch the uri
export const uploadUserAvatar = async (
  userId: string,
  fileOrUri: any,
  isUri: boolean,
  callbacks: AvatarFlowCallbacks = {}
) => {
  const { onStart, onProgress, onFinish, onError } = callbacks;
  if (!userId) throw new Error('Missing userId');

  let blob: Blob | null = null;
  try {
    onStart && onStart();

    if (isUri) {
      const resp = await fetch(fileOrUri);
      blob = await resp.blob();
    } else {
      blob = fileOrUri as Blob;
    }

    // basic validation
    const mime = (blob as any).type as string | undefined;
    const size = (blob as any).size || 0;
    const maxBytes = 5 * 1024 * 1024;
    if (mime && !mime.startsWith('image/')) throw new Error('Invalid file type');
    if (size && size > maxBytes) throw new Error('File too large');

    const { promise } = uploadAvatar(userId, blob, (pct) => {
      onProgress && onProgress(pct);
    });

    const result = await promise;
    const url = result.url;
    await updateUserProfile(userId, { avatarUrl: url });
    onFinish && onFinish(url);
    return url;
  } catch (err: any) {
    onError && onError(err);
    throw err;
  }
};
