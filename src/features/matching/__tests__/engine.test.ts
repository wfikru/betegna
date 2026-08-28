import { rankPros, scorePro, MATCH_WEIGHTS } from '../engine';
import type { ProfessionalProfile, ServiceRequest } from '../../../models/types';

function pro(overrides: Partial<ProfessionalProfile>): ProfessionalProfile {
  return {
    uid: 'pro-1',
    displayName: 'Test Pro',
    businessName: 'Test Pro LLC',
    about: '',
    categoryIds: ['cleaning'],
    serviceIds: ['house-cleaning'],
    services: [],
    serviceArea: ['Bole'],
    baseLocation: { subcity: 'Bole', city: 'Addis Ababa', geo: { lat: 8.9936, lng: 38.7871 } },
    startingPrice: 600,
    priceUnit: 'visit',
    rating: 4.8,
    reviewCount: 100,
    jobsCompleted: 200,
    yearsExperience: 5,
    responseRatePct: 95,
    medianResponseMinutes: 10,
    completionRatePct: 98,
    verified: true,
    badges: [],
    availability: {
      workingHours: { 0: { enabled: true, start: '08:00', end: '18:00' }, 1: { enabled: true, start: '08:00', end: '18:00' }, 2: { enabled: true, start: '08:00', end: '18:00' }, 3: { enabled: true, start: '08:00', end: '18:00' }, 4: { enabled: true, start: '08:00', end: '18:00' }, 5: { enabled: true, start: '08:00', end: '18:00' }, 6: { enabled: true, start: '08:00', end: '18:00' } },
      vacationDates: [],
      slotDurationMin: 120,
      bufferMin: 30,
    },
    portfolio: [],
    credentials: [],
    joinedAt: 0,
    ...overrides,
  };
}

function request(overrides: Partial<ServiceRequest> = {}): Pick<ServiceRequest, 'serviceId' | 'categoryId' | 'location' | 'when'> {
  return {
    serviceId: 'house-cleaning',
    categoryId: 'cleaning',
    location: { subcity: 'Bole', city: 'Addis Ababa' },
    when: { urgency: 'this_week', frequency: 'one_time' },
    ...overrides,
  };
}

describe('matching engine', () => {
  it('scores a well-matched professional above the minimum threshold', () => {
    const result = scorePro(request(), pro({}));
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('gives full service weight to an exact service match and half for category-only', () => {
    const exact = scorePro(request(), pro({}));
    const categoryOnly = scorePro(request(), pro({ serviceIds: ['deep-cleaning'] }));
    expect(exact.breakdown.service).toBe(MATCH_WEIGHTS.service);
    expect(categoryOnly.breakdown.service).toBe(MATCH_WEIGHTS.service * 0.5);
  });

  it('penalizes professionals outside the service area sub-city', () => {
    const inside = scorePro(request(), pro({ serviceArea: ['Bole'] }));
    const outside = scorePro(request(), pro({ serviceArea: ['Akaki'] }));
    expect(inside.breakdown.location).toBeGreaterThan(outside.breakdown.location);
  });

  it('penalizes vacation days that collide with the requested date', () => {
    const date = '2030-05-15'; // a Wednesday
    const working = scorePro(request({ when: { urgency: 'flexible', frequency: 'one_time', preferredDate: date } }), pro({}));
    const onVacation = scorePro(
      request({ when: { urgency: 'flexible', frequency: 'one_time', preferredDate: date } }),
      pro({ availability: { workingHours: pro({}).availability.workingHours, vacationDates: [date], slotDurationMin: 120, bufferMin: 30 } }),
    );
    expect(working.breakdown.availability).toBeGreaterThan(onVacation.breakdown.availability);
  });

  it('ranks best pros first and filters below-threshold matches', () => {
    const good = pro({ uid: 'good' });
    const mediocre = pro({
      uid: 'bad',
      serviceIds: ['gardening'],
      categoryIds: ['gardening'],
      serviceArea: ['Akaki'],
      rating: 3.5,
      reviewCount: 2,
      responseRatePct: 40,
      medianResponseMinutes: 240,
      completionRatePct: 70,
      verified: false,
      yearsExperience: 0,
      startingPrice: 99999,
    });
    const ranked = rankPros(request(), [mediocre, good]);
    expect(ranked[0]?.proId).toBe('good');
    expect(ranked.length).toBeLessThanOrEqual(2);
  });

  it('returns deterministic scores for identical inputs', () => {
    const a = scorePro(request(), pro({}));
    const b = scorePro(request(), pro({}));
    expect(a.score).toBe(b.score);
  });
});
