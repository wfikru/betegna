/**
 * Environment & backend mode.
 *
 * "demo"    → bundled demo backend (seeded Ethiopian marketplace data, simulated
 *             real-time professionals). No credentials required — perfect for
 *             development, previews, and UI work.
 * "firebase"→ real Firebase project via the EXPO_PUBLIC_FIREBASE_* env vars.
 *
 * The rest of the app never branches on this flag directly; it only talks to
 * the service layer (src/services/*), which selects the implementation here.
 */
export type BackendMode = 'demo' | 'firebase';

function readMode(): BackendMode {
  const m = process.env.EXPO_PUBLIC_BACKEND_MODE;
  return m === 'firebase' ? 'firebase' : 'demo';
}

export const ENV = {
  mode: readMode(),
  isDemo: readMode() === 'demo',
  isFirebase: readMode() === 'firebase',
  supportPhone: process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '+251900000000',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@betegna.app',
};

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const c = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const complete = Object.values(c).every((v) => !!v && v.length > 0);
  return complete ? (c as FirebaseWebConfig) : null;
}
