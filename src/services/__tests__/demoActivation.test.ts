/**
 * Headless regression test for the professional activation flow (demo layer):
 * sign up → ensure profile → save profile → activate (role switch) →
 * the dashboard MUST find the profile (the old "setup loop" bug was
 * updatePro no-opping on a missing entry).
 */
import { demo } from '../firebase/demoDb';

describe('professional activation (demo backend)', () => {
  it('dashboard finds the profile after guided onboarding activates', async () => {
    const user = await demo.signUp({ name: 'Test Pro', email: `pro${Date.now()}@t.co`, password: 'password1', role: 'customer' });

    // no profile yet — dashboard would show the setup guard
    expect(demo.pro(user.uid)).toBeUndefined();

    // onboarding flow: ensure → build → save → activate
    const base = demo.ensureUserProProfile(user); // same scaffold the service builds
    const profile = {
      ...base,
      businessName: 'Test Pro Services',
      about: 'Experienced plumber',
      categoryIds: ['plumbing'],
      serviceIds: ['plumbing-general'],
      services: [{ id: 's1', name: 'Visit', price: 400, unit: 'visit' as const }],
      serviceArea: ['Bole'],
      startingPrice: 400,
    };
    demo.updatePro(user.uid, profile); // saveProProfile (demo path)
    expect(demo.pro(user.uid)?.businessName).toBe('Test Pro Services');

    // activateProfessionalAccount (demo path): re-save + seed leads + switch role
    demo.updatePro(user.uid, profile);
    demo.seedLeadsForUserPro(demo.currentUser() ?? user);
    const updated = demo.updateUser(user.uid, { activeRole: 'professional', roles: [...user.roles, 'professional'] });

    // the dashboard's getPro must now return the profile
    expect(updated?.activeRole).toBe('professional');
    expect(demo.pro(user.uid)).not.toBeNull();
    expect(demo.pro(user.uid)?.businessName).toBe('Test Pro Services');
    expect(demo.pro(user.uid)?.serviceArea).toContain('Bole');

    // leads were seeded for the new pro
    expect(demo.leadsForPro(user.uid).length).toBeGreaterThan(0);
  });

  it('updatePro creates a profile from a partial patch (upsert semantics)', () => {
    demo.updatePro('ghost-pro', { uid: 'ghost-pro', businessName: 'Ghost', about: 'x' } as never);
    expect(demo.pro('ghost-pro')?.businessName).toBe('Ghost');
  });
});
