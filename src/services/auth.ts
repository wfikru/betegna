/** Authentication & account service (demo ⇄ firebase behind one surface). */
import { ENV } from '../config/env';
import type { AppUser, ProfessionalProfile, UserRole } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (ENV.isDemo) return demo.signIn(email, password);
  return fb.fbSignIn(email, password);
}

export async function signUp(input: { name: string; email: string; password: string; role: UserRole }): Promise<AppUser> {
  if (ENV.isDemo) return demo.signUp(input);
  return fb.fbSignUp(input);
}

export async function signOut(): Promise<void> {
  if (ENV.isDemo) return demo.signOut();
  return fb.fbSignOut();
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (ENV.isDemo) return; // demo: no-op
  return fb.fbSendReset(email);
}

/** Fires with the signed-in user (or null). Returns unsubscribe. */
export function onAuthStateChanged(cb: (user: AppUser | null) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.currentUser()));
    return demo.subscribe('auth', () => cb(demo.currentUser()));
  }
  return fb.fbOnAuth((uid) => {
    if (!uid) {
      cb(null);
      return;
    }
    void fb.fbGetUser(uid).then(cb);
  });
}

export async function updateUser(uid: string, patch: Partial<AppUser>): Promise<AppUser | null> {
  if (ENV.isDemo) return demo.updateUser(uid, patch);
  await fb.fbUpdateUser(uid, patch);
  return fb.fbGetUser(uid);
}

/** Switch active shell (customer ⇄ professional). One account can hold both roles. */
export async function switchActiveRole(user: AppUser, role: UserRole): Promise<AppUser | null> {
  const roles = user.roles.includes(role) ? user.roles : [...user.roles, role];
  const patch: Partial<AppUser> = { activeRole: role, roles };
  return updateUser(user.uid, patch);
}

/** Scaffold for a new professional profile (filled in by guided onboarding). */
export function blankProProfile(user: AppUser): ProfessionalProfile {
  const wh: ProfessionalProfile['availability']['workingHours'] = {};
  for (let d = 0; d <= 6; d++) wh[d] = { enabled: d >= 1 && d <= 6, start: '08:00', end: '18:00' };
  return {
    uid: user.uid,
    displayName: user.name,
    businessName: `${user.name.split(' ')[0] ?? user.name} Services`,
    about: '',
    categoryIds: [],
    serviceIds: [],
    services: [],
    serviceArea: [],
    baseLocation: user.homeArea ?? { subcity: 'Bole', city: 'Addis Ababa' },
    startingPrice: 0,
    priceUnit: 'visit',
    rating: 0,
    reviewCount: 0,
    jobsCompleted: 0,
    yearsExperience: 1,
    responseRatePct: 100,
    medianResponseMinutes: 5,
    completionRatePct: 100,
    verified: false,
    badges: [],
    availability: { workingHours: wh, vacationDates: [], slotDurationMin: 120, bufferMin: 30 },
    portfolio: [],
    credentials: [],
    joinedAt: Date.now(),
  };
}

/**
 * Complete guided onboarding: save the profile, grant the professional role,
 * switch shells — and in demo mode seed first leads so the workspace is alive.
 */
export async function activateProfessionalAccount(
  user: AppUser,
  profile: ProfessionalProfile,
): Promise<AppUser | null> {
  if (ENV.isDemo) {
    await demo.ready();
    demo.updatePro(user.uid, profile);
    demo.seedLeadsForUserPro(demo.currentUser() ?? user);
  } else {
    await fb.fbUpsertPro(profile);
  }
  return switchActiveRole(user, 'professional');
}

export async function ensureProfessionalProfile(user: AppUser): Promise<ProfessionalProfile> {
  if (ENV.isDemo) {
    await demo.ready();
    const existing = demo.pro(user.uid);
    if (existing) return existing;
    demo.updatePro(user.uid, blankProProfile(user)); // upsert — creates if missing
    return demo.pro(user.uid) ?? blankProProfile(user);
  }
  const existing = await fb.fbGetPro(user.uid);
  if (existing) return existing;
  const profile = blankProProfile(user);
  await fb.fbUpsertPro(profile);
  return profile;
}
