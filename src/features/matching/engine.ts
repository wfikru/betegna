/**
 * Professional matching engine (configuration-driven, AI-ready).
 *
 * Match Score (0–100) =
 *   Service 30 + Location 20 + Availability 12 + Rating 12 +
 *   Experience 6 + Responsiveness 10 + Price 4 + Performance 6
 *
 * Weights live in MATCH_WEIGHTS so admins/tuning can adjust without logic
 * changes; a future AI ranker can re-order `rankPros` output behind the same API.
 */
import type {
  MatchResult,
  MatchScoreBreakdown,
  ProfessionalProfile,
  ServiceRequest,
  Urgency,
} from '../../models/types';
import { getService } from '../../config/seed/taxonomy';
import { subcityByName } from '../../constants/geo';
import { haversineKm } from '../../utils/geo';

export interface MatchWeights {
  service: number;
  location: number;
  availability: number;
  rating: number;
  experience: number;
  responsiveness: number;
  price: number;
  performance: number;
}

export const MATCH_WEIGHTS: MatchWeights = {
  service: 30,
  location: 20,
  availability: 12,
  rating: 12,
  experience: 6,
  responsiveness: 10,
  price: 4,
  performance: 6,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function dayMatchesAvailability(pro: ProfessionalProfile, dateISO?: string): boolean {
  if (!dateISO) return true;
  const d = new Date(`${dateISO}T00:00:00`);
  if (isNaN(d.getTime())) return true;
  const day = d.getDay();
  const win = pro.availability.workingHours[day];
  if (!win || !win.enabled) return false;
  if (pro.availability.vacationDates.includes(dateISO)) return false;
  return true;
}

export function scorePro(
  request: Pick<ServiceRequest, 'serviceId' | 'categoryId' | 'location' | 'when'>,
  pro: ProfessionalProfile,
  weights: MatchWeights = MATCH_WEIGHTS,
): MatchResult {
  const svc = getService(request.serviceId);
  const b: MatchScoreBreakdown = {
    service: 0,
    location: 0,
    availability: 0,
    rating: 0,
    experience: 0,
    responsiveness: 0,
    price: 0,
    performance: 0,
  };

  // 1) Service match
  if (pro.serviceIds.includes(request.serviceId)) b.service = weights.service;
  else if (svc && pro.categoryIds.includes(svc.categoryId)) b.service = weights.service * 0.5;
  else b.service = 0;

  // 2) Location
  let distanceKm: number | undefined;
  const reqGeo = request.location.geo ?? subcityByName(request.location.subcity)?.geo;
  if (pro.serviceArea.includes(request.location.subcity)) {
    b.location = weights.location;
  } else if (reqGeo && pro.baseLocation.geo) {
    distanceKm = haversineKm(reqGeo, pro.baseLocation.geo);
    if (distanceKm <= 5) b.location = weights.location * 0.85;
    else if (distanceKm <= 10) b.location = weights.location * 0.55;
    else if (distanceKm <= 15) b.location = weights.location * 0.3;
    else b.location = weights.location * 0.1;
  } else {
    b.location = weights.location * 0.2;
  }

  // 3) Availability (requested date, or urgency fallback)
  const urgent: Urgency = request.when.urgency;
  const dateISO =
    request.when.preferredDate ??
    (urgent === 'today' ? new Date().toISOString().slice(0, 10) : undefined);
  const worksThatDay = dayMatchesAvailability(pro, dateISO);
  b.availability = worksThatDay ? weights.availability : weights.availability * 0.3;
  if (urgent === 'emergency' || urgent === 'today') {
    // urgent jobs need pros who respond fast / are online
    if (pro.online) b.availability = Math.min(weights.availability, b.availability + 1);
  }

  // 4) Rating (quality + volume)
  b.rating =
    clamp01(pro.rating / 5) * (weights.rating * 0.8) +
    clamp01(pro.reviewCount / 200) * (weights.rating * 0.2);

  // 5) Experience
  b.experience = clamp01(pro.yearsExperience / 10) * weights.experience;

  // 6) Responsiveness
  const speedPoints =
    pro.medianResponseMinutes <= 15 ? 1 : pro.medianResponseMinutes <= 30 ? 0.6 : 0.2;
  b.responsiveness =
    clamp01(pro.responseRatePct / 100) * (weights.responsiveness * 0.6) +
    speedPoints * (weights.responsiveness * 0.25) +
    (pro.online ? weights.responsiveness * 0.15 : 0);

  // 7) Price compatibility vs. category starting price
  if (svc) {
    const ratio = pro.startingPrice / Math.max(1, svc.fromPrice);
    if (ratio <= 1.25) b.price = weights.price;
    else if (ratio <= 2) b.price = weights.price * 0.5;
    else b.price = 0;
  }

  // 8) Historical performance + trust
  b.performance =
    clamp01(pro.completionRatePct / 100) * (weights.performance * 0.65) +
    (pro.verified ? weights.performance * 0.35 : 0);

  const raw = Object.values(b).reduce((sum, v) => sum + v, 0);
  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const score = Math.round((raw / totalWeight) * 1000) / 10;

  return { proId: pro.uid, score, breakdown: b, distanceKm };
}

export const MIN_MATCH_SCORE = 35;

/** Rank professionals for a request. Returns best first. */
export function rankPros(
  request: Pick<ServiceRequest, 'serviceId' | 'categoryId' | 'location' | 'when'>,
  pros: ProfessionalProfile[],
  opts?: { limit?: number; minScore?: number },
): MatchResult[] {
  const minScore = opts?.minScore ?? MIN_MATCH_SCORE;
  return pros
    .map((p) => scorePro(request, p))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts?.limit ?? 10);
}
