// @ts-check
// Firebase-backed API client (previously called Base44)

// reuse single initialization from src/lib/firebase.js
import { auth, db } from "@/lib/firebase";

/**
 * @typedef {import("../types/entities").Task} Task
 * @typedef {import("../types/entities").TaskOffer} TaskOffer
 * @typedef {import("../types/entities").Review} Review
 * @typedef {import("../types/entities").User} User
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  documentId
} from "firebase/firestore";

// helper that builds a Firestore query from the simple filter syntax used by the UI
const buildFilter = async (collectionName, conditions = {}, sort = "", lim = 0) => {
  let q = collection(db, collectionName);

  Object.entries(conditions).forEach(([k, v]) => {
    if (k === "id") {
      // query on the document ID rather than a field named "id"
      q = query(q, where(documentId(), "==", v));
    } else {
      q = query(q, where(k, "==", v));
    }
  });

  if (sort) {
    const direction = sort.startsWith("-") ? "desc" : "asc";
    const field = sort.replace(/^-/, "");
    q = query(q, orderBy(field, direction));
  }
  if (lim) {
    q = query(q, limitFn(lim));
  }

  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Firestore complains when a compound query needs an index.
    // Provide a fallback by retrying without the `orderBy`, and log a
    // helpful message pointing the developer toward the console link.
    if (err.message && err.message.includes("requires an index")) {
      console.warn("Firestore query needs a composite index:", err.message);
      console.warn(
        "Create it here:",
        // the console URL format is stable enough that we can
        // construct one generically for the project if necessary.
        `https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/firestore/indexes`
      );
      // retry without sorting (query only by filters)
      let fallback = collection(db, collectionName);
      Object.entries(conditions).forEach(([k, v]) => {
        fallback = query(fallback, where(k, "==", v));
      });
      if (lim) {
        fallback = query(fallback, limitFn(lim));
      }
      const snap2 = await getDocs(fallback);
      return snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    throw err;
  }
};

const entities = {
  Task: {
    /**
     * @param {Partial<Task>} conds
     * @param {string} sort
     * @param {number} lim
     * @returns {Promise<Task[]>}
     */
    filter: (conds, sort, lim) => buildFilter("tasks", conds, sort, lim),
    /** @param {Omit<Task, 'id'>} data */
    create: (data) => addDoc(collection(db, "tasks"), { ...data, created_date: new Date().toISOString() }),
    /** @param {string} id @param {Partial<Task>} data */
    update: (id, data) => updateDoc(doc(db, "tasks", id), data),
  },
  TaskOffer: {
    /**
     * @param {Partial<TaskOffer>} conds
     * @param {string} sort
     * @param {number} lim
     * @returns {Promise<TaskOffer[]>}
     */
    filter: (conds, sort, lim) => buildFilter("taskOffers", conds, sort, lim),
    /** @param {Omit<TaskOffer, 'id'>} data */
    create: (data) => addDoc(collection(db, "taskOffers"), { ...data, created_date: new Date().toISOString() }),
    /** @param {string} id @param {Partial<TaskOffer>} data */
    update: (id, data) => updateDoc(doc(db, "taskOffers", id), data),
  },
  Review: {
    /**
     * @param {Partial<Review>} conds
     * @param {string} sort
     * @param {number} lim
     * @returns {Promise<Review[]>}
     */
    filter: (conds, sort, lim) => buildFilter("reviews", conds, sort, lim),
    /** @param {Omit<Review, 'id'>} data */
    create: (data) => addDoc(collection(db, "reviews"), { ...data, created_date: new Date().toISOString() }),
    /** @param {string} id @param {Partial<Review>} data */
    update: (id, data) => updateDoc(doc(db, "reviews", id), data),
    /** @param {string} id */
    delete: (id) => deleteDoc(doc(db, "reviews", id)),
  },
  Notification: {
    /**
     * @param {Partial<Notification>} conds
     * @param {string} sort
     * @param {number} lim
     * @returns {Promise<Notification[]>}
     */
    filter: (conds, sort, lim) => buildFilter("notifications", conds, sort, lim),
    /** @param {Omit<Notification, 'id'>} data */
    create: (data) => addDoc(collection(db, "notifications"), { ...data, created_date: new Date().toISOString() }),
    /** @param {string} id @param {Partial<Notification>} data */
    update: (id, data) => updateDoc(doc(db, "notifications", id), data),
  },
  Message: {
    /**
     * @param {Partial<Message>} conds
     * @param {string} sort
     * @param {number} lim
     * @returns {Promise<Message[]>}
     */
    filter: (conds, sort, lim) => buildFilter("messages", conds, sort, lim),
    /** @param {Omit<Message, 'id'>} data */
    create: (data) => addDoc(collection(db, "messages"), { ...data, created_date: new Date().toISOString() }),
    /** @param {string} id @param {Partial<Message>} data */
    update: (id, data) => updateDoc(doc(db, "messages", id), data),
  },
};

const authWrapper = {
  /**
   * @returns {Promise<User>}
   */
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
  /**
   * @param {Partial<User>} data
   * @returns {Promise<User>}
   */
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
  // signup helper exposing email/password with firstName and lastName
  signUp: async (email, password, firstName, lastName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set display name to full name
    const fullName = `${firstName} ${lastName}`.trim();
    await updateProfile(userCredential.user, { displayName: fullName });
    
    // Initialize user doc in Firestore with profile data
    const userRef = doc(db, "users", userCredential.user.uid);
    await setDoc(userRef, {
      email,
      firstName,
      lastName,
      full_name: fullName,
      created_date: new Date().toISOString(),
    }, { merge: true });
    return userCredential;
  },
  // google popup login
  signInWithGoogle: () => {
    const provider = new GoogleAuthProvider();
    // optional: restrict to specific hosted domain (e.g., your organization)
    // provider.setCustomParameters({ hd: 'example.com' });
    return signInWithPopup(auth, provider);
  },
  // password reset email
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
};

export const api = {
  auth: authWrapper,
  entities,
};

// also expose the raw auth and db objects for convenience
export { auth, db };
