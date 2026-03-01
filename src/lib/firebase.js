// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';
import { getStorage }     from 'firebase/storage';
// …other services you need…

// configuration is loaded from Vite environment variables (see .env.local)
// the values are generated in your Firebase console under project settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// basic sanity checks for the config; the placeholders from the template
// contain the string "your_", which is not a valid key. warn loudly.
if (!firebaseConfig.apiKey) {
  console.warn('Firebase configuration is missing. Did you create .env.local with your project values?');
} else if (firebaseConfig.apiKey.includes('your_') || firebaseConfig.projectId.includes('your_')) {
  console.warn('Firebase configuration appears to contain placeholder values.\n' +
               'Make sure you copied the correct settings from the Firebase console.');
}

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);