/** Reputation aggregation — keeps new professionals from being unfairly buried. */
import type { ProfessionalProfile, Review } from '../../models/types';

export interface ReputationUpdate {
  rating: number;
  reviewCount: number;
}

/**
 * Bayesian-ish average: blends a professional's average with a prior (4.2, 10 reviews)
 * so a single 5-star review doesn't outrank 200 reviews at 4.8.
 */
export function updatedReputation(pro: Pick<ProfessionalProfile, 'rating' | 'reviewCount'>, newReview: Pick<Review, 'overall'>): ReputationUpdate {
  const PRIOR_RATING = 4.2;
  const PRIOR_WEIGHT = 10;
  const count = pro.reviewCount;
  const sum = pro.rating * count + newReview.overall;
  const nextCount = count + 1;
  const blended = (sum + PRIOR_RATING * PRIOR_WEIGHT) / (nextCount + PRIOR_WEIGHT);
  return { rating: Math.round(blended * 10) / 10, reviewCount: nextCount };
}

export function profileStrength(pro: Pick<ProfessionalProfile, 'about' | 'services' | 'portfolio' | 'credentials' | 'serviceArea' | 'availability'>): number {
  let score = 0;
  if (pro.about.length > 80) score += 20; else if (pro.about.length > 0) score += 8;
  if (pro.services.length >= 3) score += 25; else if (pro.services.length > 0) score += 12;
  if (pro.portfolio.length >= 3) score += 20; else if (pro.portfolio.length > 0) score += 8;
  if (pro.credentials.length > 0) score += 15;
  if (pro.serviceArea.length >= 3) score += 10; else if (pro.serviceArea.length > 0) score += 5;
  const enabledDays = Object.values(pro.availability.workingHours).filter((d) => d.enabled).length;
  if (enabledDays >= 5) score += 10; else if (enabledDays >= 2) score += 5;
  return Math.min(100, score);
}
