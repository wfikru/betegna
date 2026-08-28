/** Reviews & reputation service. */
import { ENV } from '../config/env';
import type { Booking, Review } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';
import { newId } from '../utils/id';
import { analytics } from './analytics';
import { updatedReputation } from '../features/reviews/reputation';

export type ReviewInput = Omit<Review, 'id' | 'createdAt'>;

export async function submitReview(input: ReviewInput): Promise<Review> {
  analytics.track('review_submitted', { proId: input.proId, overall: input.overall });
  if (ENV.isDemo) return demo.addReview(input);
  await fb.fbAddReview({ ...input, id: newId(), createdAt: Date.now() } as Record<string, unknown>);
  // reputation aggregation runs in Cloud Functions (functions/index.js)
  return { ...input, id: newId(), createdAt: Date.now() };
}

export function subscribeReviewsForPro(proUid: string, cb: (r: Review[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.reviewsForPro(proUid)));
    return demo.subscribe('reviews', () => cb(demo.reviewsForPro(proUid)));
  }
  void fb.fbReviewsForPro(proUid).then((rows) =>
    cb(rows as unknown as Review[]),
  );
  return () => {};
}

export async function markBookingReviewed(booking: Booking): Promise<void> {
  if (ENV.isDemo) {
    demo.updateBooking(booking.id, { reviewed: true });
  }
}

export { updatedReputation };
