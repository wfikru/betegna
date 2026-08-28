/**
 * Firebase adapter — the production implementation of the service surface.
 * Initialized only when EXPO_PUBLIC_BACKEND_MODE=firebase and a complete
 * web config is present. Mirrors the demo backend API 1:1.
 *
 * Sensitive operations (quote acceptance → booking, payment capture, reputation
 * aggregation) are performed by Cloud Functions in production; the client-side
 * writes here are the development path (see functions/index.js).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  type Firestore,
} from 'firebase/firestore';
import { ENV, getFirebaseConfig } from '../../config/env';
import type {
  AppNotification,
  AppUser,
  Booking,
  Conversation,
  Lead,
  Message,
  ProfessionalProfile,
  Quote,
  ServiceRequest,
  UserRole,
} from '../../models/types';
import { rankPros } from '../../features/matching/engine';
import { newId } from '../../utils/id';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function isFirebaseActive(): boolean {
  return ENV.isFirebase && getFirebaseConfig() !== null;
}

function ensureInit(): { auth: Auth; db: Firestore } {
  if (!auth || !db) {
    const config = getFirebaseConfig();
    if (!config) throw new Error('Firebase is not configured (missing EXPO_PUBLIC_FIREBASE_* vars)');
    app = getApps().length ? getApp() : initializeApp(config);
    if (Platform.OS !== 'web') {
      // React Native persistence (AsyncStorage) — export present at runtime on RN builds
      const rnPersistence = (firebaseAuth as unknown as Record<string, unknown>).getReactNativePersistence as
        | ((storage: typeof AsyncStorage) => unknown)
        | undefined;
      auth = rnPersistence
        ? initializeAuth(app, { persistence: rnPersistence(AsyncStorage) as never })
        : getAuth(app);
    } else {
      auth = getAuth(app); // browser local persistence by default
    }
    db = getFirestore(app);
  }
  return { auth, db: db! };
}

/** Firestore rejects `undefined` values — strip them recursively before writes. */
function clean<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map((v) => clean(v)) as unknown as T;
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) out[k] = clean(v);
    }
    return out as T;
  }
  return obj;
}

/* ── auth ── */

export async function fbSignUp(input: { name: string; email: string; password: string; role: UserRole }): Promise<AppUser> {
  const { auth, db } = ensureInit();
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await updateProfile(cred.user, { displayName: input.name });
  const user: AppUser = {
    uid: cred.user.uid,
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    roles: [input.role],
    activeRole: input.role,
    locale: 'en',
    emailVerified: cred.user.emailVerified,
    notificationPrefs: {
      channels: { inApp: true, push: true, email: true, sms: false },
      kinds: { message: true, request: true, quote: true, booking: true, payment: true, review: true, lead: true, system: true },
    },
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', user.uid), clean(user));
  return user;
}

export async function fbSignIn(email: string, password: string): Promise<AppUser> {
  const { auth, db } = ensureInit();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) throw new Error('User profile missing — contact support');
  return snap.data() as AppUser;
}

export function fbOnAuth(cb: (uid: string | null) => void): () => void {
  const { auth } = ensureInit();
  return onAuthStateChanged(auth, (u) => cb(u ? u.uid : null));
}

export async function fbSignOut(): Promise<void> {
  const { auth } = ensureInit();
  await firebaseSignOut(auth);
}

export async function fbSendReset(email: string): Promise<void> {
  const { auth } = ensureInit();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function fbGetUser(uid: string): Promise<AppUser | null> {
  const { db } = ensureInit();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

export async function fbUpdateUser(uid: string, patch: Partial<AppUser>): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'users', uid), clean(patch));
}

export function fbSubscribeUser(uid: string, cb: (u: AppUser | null) => void): () => void {
  const { db } = ensureInit();
  return onSnapshot(doc(db, 'users', uid), (snap) => cb(snap.exists() ? (snap.data() as AppUser) : null));
}

/* ── professionals ── */

export async function fbGetPro(uid: string): Promise<ProfessionalProfile | null> {
  const { db } = ensureInit();
  const snap = await getDoc(doc(db, 'professionals', uid));
  return snap.exists() ? (snap.data() as ProfessionalProfile) : null;
}

export async function fbUpsertPro(profile: ProfessionalProfile): Promise<void> {
  const { db } = ensureInit();
  await setDoc(doc(db, 'professionals', profile.uid), clean(profile), { merge: true });
}

export async function fbProsByService(serviceId: string): Promise<ProfessionalProfile[]> {
  const { db } = ensureInit();
  const snap = await getDocs(query(collection(db, 'professionals'), where('serviceIds', 'array-contains', serviceId)));
  return snap.docs.map((d) => d.data() as ProfessionalProfile);
}

export async function fbAllPros(): Promise<ProfessionalProfile[]> {
  const { db } = ensureInit();
  const snap = await getDocs(collection(db, 'professionals'));
  return snap.docs.map((d) => d.data() as ProfessionalProfile);
}

/* ── requests & matching ── */

export async function fbCreateRequest(request: ServiceRequest): Promise<void> {
  const { db } = ensureInit();
  // NOTE: matching fan-out (matchedProIds + leads) is done by the
  // fanoutRequestMatches Cloud Function trigger — the client never writes leads.
  await setDoc(doc(db, 'serviceRequests', request.id), clean(request));
}

export function fbSubscribeRequests(uid: string, cb: (r: ServiceRequest[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'serviceRequests'), where('customerId', '==', uid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as ServiceRequest)));
}

export async function fbGetRequest(id: string): Promise<ServiceRequest | null> {
  const { db } = ensureInit();
  const snap = await getDoc(doc(db, 'serviceRequests', id));
  return snap.exists() ? (snap.data() as ServiceRequest) : null;
}

export async function fbUpdateRequest(id: string, patch: Partial<ServiceRequest>): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'serviceRequests', id), clean({ ...patch, updatedAt: Date.now() }));
}

/* ── leads ── */

export function fbSubscribeLeads(proUid: string, cb: (l: Lead[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'leads'), where('proId', '==', proUid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Lead)));
}

export async function fbUpdateLead(leadId: string, patch: Partial<Lead>): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'leads', leadId), clean({ ...patch, updatedAt: Date.now() }));
}

/* ── quotes ── */

export async function fbSendQuote(quote: Quote): Promise<void> {
  const { db } = ensureInit();
  await setDoc(doc(db, 'quotes', quote.id), clean(quote));
}

export function fbSubscribeQuotesForRequest(requestId: string, cb: (q: Quote[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'quotes'), where('requestId', '==', requestId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Quote)));
}

export async function fbGetQuoteById(id: string): Promise<Quote | null> {
  const { db } = ensureInit();
  const snap = await getDoc(doc(db, 'quotes', id));
  return snap.exists() ? (snap.data() as Quote) : null;
}

export async function fbUpdateQuote(quoteId: string, patch: Partial<Quote>): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'quotes', quoteId), clean({ ...patch, updatedAt: Date.now() }));
}

/* ── bookings ── */

export async function fbCreateBooking(booking: Booking): Promise<void> {
  const { db } = ensureInit();
  await setDoc(doc(db, 'bookings', booking.id), clean(booking));
}

export function fbSubscribeBookings(field: 'customerId' | 'proId', uid: string, cb: (b: Booking[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'bookings'), where(field, '==', uid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Booking)));
}

export async function fbUpdateBooking(id: string, patch: Partial<Booking>): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'bookings', id), clean({ ...patch, updatedAt: Date.now() }));
}

/* ── chat ── */

export async function fbEnsureConversation(conv: Conversation): Promise<Conversation> {
  const { db } = ensureInit();
  const id = `${conv.customerId}__${conv.proId}__${conv.requestId ?? 'direct'}`;
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // participants[] powers the security rules + list queries
    const withId: Conversation = {
      ...conv,
      id,
      participants: [conv.customerId, conv.proId],
    } as Conversation;
    await setDoc(ref, clean(withId));
    return withId;
  }
  return snap.data() as Conversation;
}

export function fbSubscribeConversations(uid: string, cb: (c: Conversation[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid), orderBy('updatedAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Conversation)));
}

export function fbSubscribeMessages(conversationId: string, pageSize: number, cb: (m: Message[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'desc'), limit(pageSize));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Message).reverse()));
}

export async function fbSendMessage(conversationId: string, message: Message): Promise<void> {
  const { db } = ensureInit();
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), clean(message));
}

export async function fbMarkConversationRead(conversationId: string, uid: string): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'conversations', conversationId), `unread.${uid}`, 0);
}

/* ── notifications ── */

export function fbSubscribeNotifications(uid: string, cb: (n: AppNotification[]) => void): () => void {
  const { db } = ensureInit();
  const q = query(collection(db, 'notifications'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as AppNotification)));
}

export async function fbMarkNotificationRead(id: string): Promise<void> {
  const { db } = ensureInit();
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

export async function fbMarkAllNotificationsRead(uid: string): Promise<void> {
  const { db } = ensureInit();
  const snap = await getDocs(query(collection(db, 'notifications'), where('uid', '==', uid), where('read', '==', false), limit(200)));
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
}

/* ── reviews / favorites / favorites-lite ── */

export async function fbAddReview(review: Record<string, unknown>): Promise<void> {
  const { db } = ensureInit();
  await setDoc(doc(db, 'reviews', String(review.id)), clean(review));
}

export async function fbReviewsForPro(proUid: string): Promise<(Record<string, unknown> & { id: string })[]> {
  const { db } = ensureInit();
  const snap = await getDocs(query(collection(db, 'reviews'), where('proId', '==', proUid), orderBy('createdAt', 'desc'), limit(20)));
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}

export async function fbToggleFavorite(uid: string, proId: string): Promise<boolean> {
  const { db } = ensureInit();
  const favId = `${uid}__${proId}`;
  const ref = doc(db, 'favorites', favId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { id: favId, customerId: uid, proId, createdAt: Date.now() });
  return true;
}

/* ── misc ── */

export function makeFirebaseId(): string {
  return newId();
}

export { QueryConstraint };
