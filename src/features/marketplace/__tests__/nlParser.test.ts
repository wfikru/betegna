import { parseIntent, searchServices } from '../nlParser';

describe('natural language parser', () => {
  it('detects plumbing intent, urgency and sub-city', () => {
    const intent = parseIntent('I need a plumber tomorrow in Bole — kitchen faucet leaking');
    expect(intent.serviceId).toBe('plumbing-general');
    expect(intent.categoryId).toBe('plumbing');
    expect(intent.urgency).toBe('tomorrow');
    expect(intent.locationHint).toBe('Bole');
  });

  it('maps faucet/leak language to faucet & leak repair', () => {
    const intent = parseIntent('My bathroom faucet is leaking and I need someone tomorrow');
    expect(intent.serviceId).toBe('faucet-leak');
    expect(intent.urgency).toBe('tomorrow');
  });

  it('detects emergencies', () => {
    const intent = parseIntent('Emergency!! burst pipe flooding the house right now');
    expect(intent.urgency).toBe('emergency');
    expect(intent.serviceId).toBe('emergency-plumbing');
  });

  it('detects recurring cleaning requests', () => {
    const intent = parseIntent('I need house cleaning every two weeks');
    expect(intent.serviceId).toBe('house-cleaning');
    expect(intent.frequency).toBe('biweekly');
  });

  it('maps landmarks to sub-cities', () => {
    expect(parseIntent('cleaner near Kazanchis').locationHint).toBe('Kirkos');
    expect(parseIntent('photographer around Piassa').locationHint).toBe('Arada');
    expect(parseIntent('tutor in CMC').locationHint).toBe('Yeka');
  });

  it('understands Amharic keywords', () => {
    const intent = parseIntent('ሰላም ለቤቴ ጽዳት እፈልጋለሁ ነገ');
    expect(intent.serviceId).toBe('house-cleaning');
    expect(intent.urgency).toBe('tomorrow');
  });

  it('handles AC / HVAC phrasing', () => {
    const intent = parseIntent('My AC is not cooling and I need someone today');
    expect(intent.serviceId).toBe('hvac');
    expect(intent.urgency).toBe('today');
  });

  it('falls back gracefully with keywords only', () => {
    const intent = parseIntent('weird gibberish xyzzy nothing matches');
    expect(intent.serviceId).toBeUndefined();
    expect(intent.confidence).toBeLessThan(0.5);
    expect(intent.keywords.length).toBeGreaterThan(0);
  });

  it('understands the Ethiopia expansion categories', () => {
    expect(parseIntent('I need a mechanic — car will not start').serviceId).toBe('auto-mechanic');
    expect(parseIntent('cockroaches everywhere in my kitchen').serviceId).toBe('pest-general');
    expect(parseIntent('I need a tailor to make a habesha kemis').serviceId).toBe('traditional-wear');
    expect(parseIntent('locked out of my house').serviceId).toBe('locksmith');
    expect(parseIntent('need a translator for amharic translation').serviceId).toBe('translation');
    expect(parseIntent('driving lessons for my son').serviceId).toBe('driving-lessons');
    expect(parseIntent('who can wash clothes every week').serviceId).toBe('laundry-wash');
    expect(parseIntent('my dog needs grooming').serviceId).toBe('pet-grooming');
    expect(parseIntent('ልብስ ማጠብ ያስፈልገኛል').serviceId).toBe('laundry-wash');
    expect(parseIntent('አይጥ ቤት ውስጥ አለ').serviceId).toBe('rodent-removal');
  });

  it('searchServices returns the exact service when intent is clear', () => {
    const results = searchServices('wedding photographer');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe('photography');
  });
});
