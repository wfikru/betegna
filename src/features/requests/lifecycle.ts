/** Request / booking state machines and timeline builders. */
import type { Booking, BookingStatus, RequestStatus, ServiceRequest, TimelineEvent } from '../../models/types';

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ['matching', 'cancelled'],
  matching: ['matched', 'cancelled'],
  matched: ['quote_received', 'cancelled'],
  quote_received: ['pro_selected', 'cancelled'],
  pro_selected: ['booked', 'quote_received', 'cancelled'],
  booked: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransitionRequest(from: RequestStatus, to: RequestStatus): boolean {
  return REQUEST_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextRequestStatus(current: RequestStatus): RequestStatus {
  switch (current) {
    case 'submitted':
      return 'matching';
    case 'matching':
      return 'matched';
    case 'matched':
      return 'quote_received';
    default:
      return current;
  }
}

const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'rescheduled', 'cancelled'],
  rescheduled: ['confirmed', 'cancelled'],
  in_progress: ['completed', 'disputed'],
  completed: ['disputed'],
  cancelled: [],
  no_show: ['cancelled'],
  disputed: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Build the standard marketplace timeline for a request (labels used by Timeline UI). */
export function requestTimeline(r: ServiceRequest): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { at: r.createdAt, kind: 'request_created', label: 'Request submitted', by: r.customerName },
    { at: r.createdAt + 1000, kind: 'matching', label: 'Professionals matched & notified' },
  ];
  if (r.matchedProIds.length) {
    events.push({ at: r.createdAt + 2000, kind: 'notified', label: `${r.matchedProIds.length} professionals notified` });
  }
  const order: RequestStatus[] = ['quote_received', 'pro_selected', 'booked', 'in_progress', 'completed'];
  const kindFor: Partial<Record<RequestStatus, string>> = {
    quote_received: 'quotes_in',
    pro_selected: 'pro_selected',
    booked: 'booked',
    in_progress: 'started',
    completed: 'completed',
  };
  const idx = order.indexOf(r.status);
  if (idx >= 0) {
    // show milestone events progressively (demo approximation of real event log)
    for (let i = 0; i <= idx; i++) {
      const st = order[i]!;
      events.push({ at: r.createdAt + (i + 3) * 3600_000, kind: kindFor[st] ?? st, label: REQUEST_LABEL[st] });
    }
  }
  if (r.status === 'cancelled') {
    events.push({ at: r.updatedAt, kind: 'cancelled', label: 'Request cancelled' });
  }
  return events.sort((a, b) => a.at - b.at);
}

const REQUEST_LABEL: Record<string, string> = {
  quote_received: 'Quotes received',
  pro_selected: 'Professional selected',
  booked: 'Booked & confirmed',
  in_progress: 'Work in progress',
  completed: 'Job completed',
};

export function bookingTimelineAdd(b: Booking, kind: string, label: string, by?: string): Booking {
  const event: TimelineEvent = { at: Date.now(), kind, label, by };
  return { ...b, timeline: [...b.timeline, event] };
}
