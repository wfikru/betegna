/** Saved professionals (favorites). */
import { ENV } from '../config/env';
import type { FavoriteItem } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';

export async function toggleFavorite(uid: string, proId: string): Promise<boolean> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.toggleFavorite(uid, proId);
  }
  return fb.fbToggleFavorite(uid, proId);
}

export function subscribeFavorites(uid: string, cb: (f: FavoriteItem[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.favoritesFor(uid)));
    return demo.subscribe('favorites:' + uid, () => cb(demo.favoritesFor(uid)));
  }
  // firebase: light polling is acceptable here; full subscription lands with the
  // favorites index (see docs/FIRESTORE_SCHEMA.md)
  return () => {};
}

export function isFavoriteSync(uid: string, proId: string): boolean {
  if (!ENV.isDemo) return false;
  return demo.isFavorite(uid, proId);
}
