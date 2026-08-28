/**
 * Server-side matching engine (Cloud Functions).
 * Kept behaviourally identical to src/features/matching/engine.ts — the client
 * version powers the demo backend and instant UI; this one is authoritative.
 */
const WEIGHTS = {
  service: 30, location: 20, availability: 12, rating: 12,
  experience: 6, responsiveness: 10, price: 4, performance: 6,
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function dayMatchesAvailability(pro, dateISO) {
  if (!dateISO) return true;
  const d = new Date(`${dateISO}T00:00:00`);
  if (isNaN(d.getTime())) return true;
  const win = (pro.availability?.workingHours || {})[d.getDay()];
  if (!win || !win.enabled) return false;
  return !(pro.availability?.vacationDates || []).includes(dateISO);
}

function scorePro(request, pro) {
  const b = { service: 0, location: 0, availability: 0, rating: 0, experience: 0, responsiveness: 0, price: 0, performance: 0 };

  b.service = (pro.serviceIds || []).includes(request.serviceId)
    ? WEIGHTS.service
    : (pro.categoryIds || []).includes(request.categoryId)
      ? WEIGHTS.service * 0.5
      : 0;

  b.location = (pro.serviceArea || []).includes(request.location.subcity)
    ? WEIGHTS.location
    : WEIGHTS.location * 0.25;

  const dateISO = request.when?.preferredDate ||
    (['today', 'emergency'].includes(request.when?.urgency) ? new Date().toISOString().slice(0, 10) : null);
  b.availability = dayMatchesAvailability(pro, dateISO) ? WEIGHTS.availability : WEIGHTS.availability * 0.3;

  b.rating = clamp01((pro.rating || 0) / 5) * WEIGHTS.rating * 0.8 + clamp01((pro.reviewCount || 0) / 200) * WEIGHTS.rating * 0.2;
  b.experience = clamp01((pro.yearsExperience || 0) / 10) * WEIGHTS.experience;
  const speed = (pro.medianResponseMinutes || 60) <= 15 ? 1 : (pro.medianResponseMinutes || 60) <= 30 ? 0.6 : 0.2;
  b.responsiveness = clamp01((pro.responseRatePct || 0) / 100) * WEIGHTS.responsiveness * 0.6 + speed * WEIGHTS.responsiveness * 0.25 + (pro.online ? WEIGHTS.responsiveness * 0.15 : 0);
  b.performance = clamp01((pro.completionRatePct || 0) / 100) * WEIGHTS.performance * 0.65 + (pro.verified ? WEIGHTS.performance * 0.35 : 0);

  const raw = Object.values(b).reduce((s, v) => s + v, 0);
  const total = Object.values(WEIGHTS).reduce((s, v) => s + v, 0);
  return { proId: pro.uid, score: Math.round((raw / total) * 1000) / 10, breakdown: b };
}

function ranking(request, pros, minScore = 35) {
  return pros.map((p) => scorePro(request, p)).filter((m) => m.score >= minScore).sort((a, b) => b.score - a.score);
}

module.exports = { ranking, scorePro, WEIGHTS };
