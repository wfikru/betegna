// @ts-nocheck
// Firebase-based replacement for the old Base44 client
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

// firebase config values must be set in .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// helper that builds a Firestore query from the simple filter syntax used by the UI
const buildFilter = async (collectionName, conditions = {}, sort = "", lim = 0) => {
  let q = collection(db, collectionName);

  Object.entries(conditions).forEach(([k, v]) => {
    q = query(q, where(k, "==", v));
  });

  if (sort) {
    const direction = sort.startsWith("-") ? "desc" : "asc";
    const field = sort.replace(/^-/, "");
    q = query(q, orderBy(field, direction));
  }
  if (lim) {
    q = query(q, limitFn(lim));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const entities = {
  Task: {
    filter: (conds, sort, lim) => buildFilter("tasks", conds, sort, lim),
    create: (data) => addDoc(collection(db, "tasks"), { ...data, created_date: new Date().toISOString() }),
    update: (id, data) => updateDoc(doc(db, "tasks", id), data),
  },
  TaskOffer: {
    filter: (conds, sort, lim) => buildFilter("taskOffers", conds, sort, lim),
    create: (data) => addDoc(collection(db, "taskOffers"), { ...data, created_date: new Date().toISOString() }),
    update: (id, data) => updateDoc(doc(db, "taskOffers", id), data),
  },
  Review: {
    create: (data) => addDoc(collection(db, "reviews"), { ...data, created_date: new Date().toISOString() }),
  },
};

const authWrapper = {
  me: async () => {
    const user = auth.currentUser;
    if (!user) return Promise.reject(new Error("Not authenticated"));
    // attempt to load additional profile fields from Firestore
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);
    const profileData = snap.exists() ? snap.data() : {};
    return {
      uid: user.uid,
      email: user.email,
      full_name: user.displayName,
      ...profileData,
    };
  },
  logout: () => signOut(auth),
  redirectToLogin: (redirectUrl) => {
    window.location.href = "/login?redirect=" + encodeURIComponent(redirectUrl);
  },
  updateMe: async (data) => {
    const user = auth.currentUser;
    if (!user) return Promise.reject(new Error("Not authenticated"));
    // update displayName if provided
    const updateProfileData = {};
    if (data.full_name) updateProfileData.displayName = data.full_name;
    if (Object.keys(updateProfileData).length) {
      await updateProfile(user, updateProfileData);
    }
    // save remaining fields to Firestore user document
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, data, { merge: true });
    return { ...data, email: user.email, full_name: user.displayName };
  },
  // simple login helper exposing email/password
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
};

export const base44 = {
  auth: authWrapper,
  entities,
};
