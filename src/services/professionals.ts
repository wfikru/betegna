/** Professional directory & search service. */
import { ENV } from '../config/env';
import type { ProfessionalProfile } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';

export interface ProFilters {
  serviceId?: string;
  categoryId?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  subcity?: string;
  sort?: 'recommended' | 'rating' | 'price' | 'response';
}

export async function getPro(uid: string): Promise<ProfessionalProfile | null> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.pro(uid) ?? null;
  }
  return fb.fbGetPro(uid);
}

export function subscribePro(uid: string, cb: (p: ProfessionalProfile | null) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.pro(uid) ?? null));
    return demo.subscribe('pro-profile:' + uid, () => cb(demo.pro(uid) ?? null));
  }
  // firebase: single fetch is enough for profile screens
  void fb.fbGetPro(uid).then(cb);
  return () => {};
}

export async function saveProProfile(profile: ProfessionalProfile): Promise<void> {
  if (ENV.isDemo) {
    demo.updatePro(profile.uid, profile);
    return;
  }
  await fb.fbUpsertPro(profile);
}

export async function searchPros(filters: ProFilters): Promise<ProfessionalProfile[]> {
  let pros: ProfessionalProfile[];
  if (ENV.isDemo) {
    await demo.ready();
    pros = demo.allPros();
  } else if (filters.serviceId) {
    pros = await fb.fbProsByService(filters.serviceId);
  } else {
    pros = await fb.fbAllPros();
  }

  let list = pros.filter((p) => !ENV.isDemo || !p.uid.startsWith('demo-customer'));
  if (filters.serviceId) list = list.filter((p) => p.serviceIds.includes(filters.serviceId!));
  if (filters.categoryId) list = list.filter((p) => p.categoryIds.includes(filters.categoryId!));
  if (filters.minRating != null) list = list.filter((p) => p.rating >= filters.minRating!);
  if (filters.maxPrice != null) list = list.filter((p) => p.startingPrice <= filters.maxPrice!);
  if (filters.verifiedOnly) list = list.filter((p) => p.verified);
  if (filters.subcity) list = list.filter((p) => p.serviceArea.includes(filters.subcity!));

  switch (filters.sort) {
    case 'rating':
      list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'price':
      list.sort((a, b) => a.startingPrice - b.startingPrice);
      break;
    case 'response':
      list.sort((a, b) => a.medianResponseMinutes - b.medianResponseMinutes);
      break;
    default:
      list.sort(
        (a, b) =>
          b.rating * 2 + b.reviewCount / 100 + (b.verified ? 1 : 0) - (a.rating * 2 + a.reviewCount / 100 + (a.verified ? 1 : 0)),
      );
  }
  return list;
}
