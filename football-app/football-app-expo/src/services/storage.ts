import { ref, uploadBytesResumable, getDownloadURL, UploadTask, UploadMetadata } from 'firebase/storage';
import { storage, auth } from './firebase';
import { getDevUser } from './devAuth';

// Return shape from uploadAvatar
export type UploadResult = {
  url: string;
  path: string;
  contentType?: string | null;
};

// Upload a File/Blob with progress callback and return the download URL + metadata.
// Returns an object and exposes a cancel() method on the returned promise for UI cancellation.
export const uploadAvatar = (
  userId: string,
  file: Blob | File | Uint8Array | ArrayBuffer,
  onProgress?: (percent: number) => void
): { promise: Promise<UploadResult>; cancel: () => void } => {
  const dev = getDevUser();
  const currentUid = auth?.currentUser?.uid || dev?.uid || null;
  if (!userId) throw new Error('Missing userId');
  if (!currentUid) throw new Error('Not signed in - cannot upload avatar. Start the app with EXPO_DEV_AUTH=true for local testing or sign in before uploading.');

  // If client-side rule expects user to only upload their own avatar, validate it here.
  if (currentUid !== userId && !(dev && currentUid === dev.uid)) {
    throw new Error('Authenticated user does not match userId - refusing to upload for a different user.');
  }

  // Preserve filename/extension when possible
  const rawName = (file as any)?.name || null;
  const safeName = rawName ? rawName.replace(/[^a-zA-Z0-9_.-]/g, '_') : `${Date.now()}`;
  const filename = `${Date.now()}-${safeName}`;
  const path = `avatars/${userId}/${filename}`;
  const r = ref(storage, path);

  // Build metadata if available
  const metadata: UploadMetadata = {};
  const contentType = (file as any)?.type || null;
  if (contentType) metadata.contentType = contentType;

  // Start upload
  const task: UploadTask = uploadBytesResumable(r, file as any, metadata);

  // Helper to unsubscribe the listener
  let unsub: (() => void) | undefined;

  const promise: Promise<UploadResult> = new Promise<UploadResult>(async (resolve, reject) => {
    try {
      await new Promise<void>((res, rej) => {
        unsub = task.on(
          'state_changed',
          (snapshot) => {
            // only report percent when totalBytes is a positive number
            if (onProgress && typeof snapshot.totalBytes === 'number' && snapshot.totalBytes > 0) {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              try {
                onProgress(pct);
              } catch (e) {
                // ignore handler errors
              }
            }
          },
          (err) => rej(err),
          () => res()
        );
      });

      const url = await getDownloadURL(r);
      resolve({ url, path, contentType });
    } catch (err: any) {
      // ensure we unsubscribe
      try {
        if (typeof unsub === 'function') unsub();
      } catch (_e) {
        // ignore
      }
      const code = err?.code || 'UNKNOWN';
      const msg = err?.message || String(err);
      reject(new Error(`Upload failed (code: ${code}): ${msg}. Check auth, CORS, and your Firebase Storage rules.`));
    } finally {
      if (typeof unsub === 'function') unsub();
    }
  });

  const cancel = () => {
    try {
      // UploadTask may expose cancel() in some SDKs; call defensively
      (task as any).cancel?.();
    } catch (_e) {
      // ignore
    }
    try {
      if (typeof unsub === 'function') unsub();
    } catch (_e) {
      // ignore
    }
  };

  return { promise, cancel };
};
