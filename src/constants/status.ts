import type {
  BookingStatus,
  LeadState,
  QuoteStatus,
  RequestStatus,
} from '../models/types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'amberFilled';

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  submitted: { label: 'Submitted', tone: 'info' },
  matching: { label: 'Finding pros', tone: 'info' },
  matched: { label: 'Pros notified', tone: 'info' },
  quote_received: { label: 'Quotes in', tone: 'accent' },
  pro_selected: { label: 'Pro selected', tone: 'accent' },
  booked: { label: 'Booked', tone: 'success' },
  in_progress: { label: 'In progress', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: Tone }> = {
  sent: { label: 'Awaiting reply', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  change_requested: { label: 'Changes requested', tone: 'warning' },
};

export const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: Tone }> = {
  requested: { label: 'Requested', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  rescheduled: { label: 'Rescheduled', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  no_show: { label: 'No show', tone: 'danger' },
  disputed: { label: 'Disputed', tone: 'danger' },
};

export const LEAD_STATE: Record<LeadState, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'amberFilled' },
  contacted: { label: 'Contacted', tone: 'info' },
  quoted: { label: 'Quoted', tone: 'info' },
  won: { label: 'Won', tone: 'success' },
  lost: { label: 'Lost', tone: 'danger' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const URGENCY_LABEL: Record<string, string> = {
  flexible: 'I’m flexible',
  this_week: 'This week',
  tomorrow: 'Tomorrow',
  today: 'Today',
  emergency: 'Emergency — ASAP',
};

export const FREQUENCY_LABEL: Record<string, string> = {
  one_time: 'One-time',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
};

export const TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00'] as const;
export const TIME_OF_DAY = ['Morning', 'Afternoon', 'Evening'] as const;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
