/** Lightweight analytics facade — buffers events; Firebase Analytics wiring happens in native builds (EAS). */
type EventProps = Record<string, string | number | boolean | undefined>;

const buffer: { event: string; at: number; props?: EventProps }[] = [];

export const FUNNEL_EVENTS = [
  'landing', 'search_started', 'service_selected', 'questionnaire_started', 'questionnaire_completed',
  'request_submitted', 'matches_viewed', 'message_sent', 'quote_received', 'quote_accepted',
  'booking_created', 'job_completed', 'review_submitted',
] as const;

function track(event: string, props?: EventProps): void {
  buffer.push({ event, at: Date.now(), props });
  if (__DEV__) console.log(`[analytics] ${event}`, props ?? '');
  // Firebase Analytics hook (native builds): analytics().logEvent(event, props)
}

function recent(count = 50) {
  return buffer.slice(-count);
}

export const analytics = { track, recent };
