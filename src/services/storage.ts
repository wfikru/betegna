/** File storage abstraction (Firebase Storage in production, pass-through in demo). */
import { ENV } from '../config/env';

export interface UploadResult {
  url: string;
}

export async function uploadPhoto(localUri: string, path: string): Promise<UploadResult> {
  if (ENV.isDemo) {
    // demo: use the local/blob URI directly (no upload backend needed)
    return { url: localUri };
  }
  // Firebase Storage path — requires native build (EAS) with storage rules deployed.
  // Kept behind the service boundary so the UI never depends on the provider.
  const { getApps } = await import('firebase/app');
  if (!getApps().length) return { url: localUri };
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const storage = getStorage();
  const blob = await (await fetch(localUri)).blob();
  const r = ref(storage, path);
  await uploadBytes(r, blob);
  return { url: await getDownloadURL(r) };
}

/** Stable placeholder photos for questionnaire "photos" answers in demo mode. */
export const SAMPLE_PHOTO_URLS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=70',
];
