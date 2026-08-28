/**
 * Betegna domain model — single source of truth for all entities.
 * Mirrors the Firestore collections (see docs/FIRESTORE_SCHEMA.md).
 */

export type Locale = 'en' | 'am';
export type UserRole = 'customer' | 'professional';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PlaceRef {
  subcity: string; // e.g. "Bole"
  city: string; // "Addis Ababa"
  address?: string;
  geo?: GeoPoint;
}

export type NotificationKind =
  | 'message'
  | 'request'
  | 'quote'
  | 'booking'
  | 'payment'
  | 'review'
  | 'lead'
  | 'system';

export interface NotificationPrefs {
  channels: { inApp: boolean; push: boolean; email: boolean; sms: boolean };
  kinds: Record<NotificationKind, boolean>;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  roles: UserRole[]; // one account can hold both roles
  activeRole: UserRole;
  locale: Locale;
  homeArea?: PlaceRef;
  emailVerified: boolean;
  notificationPrefs: NotificationPrefs;
  createdAt: number;
}

/* ── Taxonomy: categories → services → dynamic questionnaires ── */

export type PriceUnit = 'hour' | 'visit' | 'sqm' | 'flat' | 'day' | 'month' | 'bag';

export type QuestionType =
  | 'single'
  | 'multi'
  | 'boolean'
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'photos'
  | 'location';

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  helpText?: string;
  required?: boolean;
  options?: QuestionOption[]; // single / multi
  placeholder?: string; // text
  unit?: string; // number
  min?: number;
  max?: number;
  maxSelect?: number; // multi
}

export interface ServiceDefinition {
  id: string;
  categoryId: string;
  name: string;
  nameAm?: string;
  description: string;
  fromPrice: number; // ETB
  priceUnit: PriceUnit;
  supportsUrgency: boolean;
  questions: Question[];
}

export interface Category {
  id: string;
  name: string;
  nameAm?: string;
  emoji: string;
  color: string;
  description: string;
  popular?: boolean;
  serviceIds: string[];
}

/* ── Natural-language intent (AI-ready seam) ── */

export type Urgency = 'flexible' | 'this_week' | 'tomorrow' | 'today' | 'emergency';
export type Frequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly';

export interface ParsedIntent {
  categoryId?: string;
  serviceId?: string;
  urgency?: Urgency;
  dateHint?: string;
  frequency?: Frequency;
  locationHint?: string;
  keywords: string[];
  confidence: number; // 0..1
}

/* ── Service requests ── */

export type RequestStatus =
  | 'submitted'
  | 'matching'
  | 'matched'
  | 'quote_received'
  | 'pro_selected'
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type AnswerValue = string | number | string[] | boolean | undefined;
export type QuestionnaireAnswers = Record<string, AnswerValue>;

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  categoryId: string;
  serviceId: string;
  serviceName: string;
  summaryText: string; // the customer's natural-language input
  parsed?: ParsedIntent;
  answers: QuestionnaireAnswers;
  description?: string;
  location: PlaceRef;
  when: {
    preferredDate?: string; // ISO date
    preferredTime?: string; // "morning" | "afternoon" | "evening" | "10:00"
    urgency: Urgency;
    frequency: Frequency;
  };
  photos: string[];
  status: RequestStatus;
  matchedProIds: string[];
  createdAt: number;
  updatedAt: number;
}

/* ── Professionals ── */

export interface ProfessionalServiceItem {
  id: string;
  name: string;
  price: number; // ETB
  unit: PriceUnit;
  description?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  imageURL: string;
  description?: string;
}

export interface DayWindow {
  enabled: boolean;
  start: string; // "08:00"
  end: string; // "18:00"
}

export interface Availability {
  workingHours: Record<number, DayWindow>; // 0 = Sunday … 6 = Saturday
  vacationDates: string[]; // ISO dates
  slotDurationMin: number;
  bufferMin: number;
}

export interface Credential {
  id: string;
  name: string;
  type: 'license' | 'certification' | 'insurance' | 'id';
  verified: boolean;
}

export interface ProfessionalProfile {
  uid: string;
  displayName: string;
  businessName: string;
  photoURL?: string;
  about: string;
  categoryIds: string[];
  serviceIds: string[];
  services: ProfessionalServiceItem[];
  serviceArea: string[]; // subcity names
  baseLocation: PlaceRef;
  startingPrice: number;
  priceUnit: PriceUnit;
  rating: number; // 0..5
  reviewCount: number;
  jobsCompleted: number;
  yearsExperience: number;
  responseRatePct: number;
  medianResponseMinutes: number;
  completionRatePct: number;
  verified: boolean;
  badges: string[]; // e.g. "Top Rated", "Background Checked"
  availability: Availability;
  portfolio: PortfolioItem[];
  credentials: Credential[];
  joinedAt: number;
  lastSeenAt?: number;
  online?: boolean;
}

/* ── Matching ── */

export interface MatchScoreBreakdown {
  service: number;
  location: number;
  availability: number;
  rating: number;
  experience: number;
  responsiveness: number;
  price: number;
  performance: number;
}

export interface MatchResult {
  proId: string;
  score: number; // 0..100
  breakdown: MatchScoreBreakdown;
  distanceKm?: number;
}

/* ── Quotes ── */

export type QuoteStatus = 'sent' | 'accepted' | 'declined' | 'expired' | 'withdrawn' | 'change_requested';

export interface QuoteLineItem {
  label: string;
  kind: 'labor' | 'material' | 'fee';
  amount: number;
}

export interface ProposedSlot {
  date: string; // ISO date
  start: string; // "10:00"
  end: string; // "12:00"
}

export interface Quote {
  id: string;
  requestId: string;
  proId: string;
  proName: string;
  proPhotoURL?: string;
  customerId: string;
  serviceName: string;
  lines: QuoteLineItem[];
  discount: number;
  taxPct: number;
  subtotal: number;
  tax: number;
  total: number;
  durationHours?: number;
  proposedSlot?: ProposedSlot;
  note?: string;
  expiresAt: number;
  status: QuoteStatus;
  createdAt: number;
  updatedAt: number;
}

/* ── Chat ── */

export interface Conversation {
  id: string;
  customerId: string;
  proId: string;
  participantNames: Record<string, string>;
  participantPhotos?: Record<string, string>;
  requestId?: string;
  quoteId?: string;
  bookingId?: string;
  lastMessage?: { text: string; at: number; senderId: string };
  unread: Record<string, number>;
  typing?: Record<string, boolean>;
  updatedAt: number;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'location'
  | 'quote'
  | 'appointment'
  | 'booking'
  | 'system';

export interface QuotePayload {
  quoteId: string;
  total: number;
  summary: string;
  status: QuoteStatus;
}

export interface AppointmentPayload {
  date: string;
  start: string;
  end: string;
  status: 'proposed' | 'accepted' | 'declined';
}

export interface BookingPayload {
  bookingId: string;
  status: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  imageURL?: string;
  payload?: QuotePayload | AppointmentPayload | BookingPayload;
  createdAt: number;
  readBy: string[];
  status?: 'sending' | 'sent' | 'failed';
}

/* ── Bookings & jobs ── */

export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'disputed';

export interface TimelineEvent {
  at: number;
  kind: string;
  label: string;
  by?: string;
}

export interface Booking {
  id: string;
  requestId: string;
  quoteId?: string;
  customerId: string;
  customerName: string;
  proId: string;
  proName: string;
  proPhotoURL?: string;
  serviceId: string;
  serviceName: string;
  scheduledAt?: ProposedSlot;
  address?: string;
  subcity?: string;
  total: number;
  status: BookingStatus;
  timeline: TimelineEvent[];
  reviewed: boolean;
  paid: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Reviews ── */

export interface Review {
  id: string;
  bookingId: string;
  requestId: string;
  customerId: string;
  customerName: string;
  proId: string;
  overall: number;
  quality: number;
  communication: number;
  professionalism: number;
  value: number;
  punctuality: number;
  text?: string;
  photos?: string[];
  proResponse?: string;
  reported?: boolean;
  createdAt: number;
}

/* ── Leads (professional-side view of a request) ── */

export type LeadState = 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'archived';

export interface Lead {
  id: string;
  requestId: string;
  proId: string;
  state: LeadState;
  score: number;
  seen: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Notifications ── */

export interface AppNotification {
  id: string;
  uid: string;
  kind: NotificationKind;
  title: string;
  body: string;
  deepLink?: string;
  read: boolean;
  createdAt: number;
}

/* ── Payments (provider-agnostic: Telebirr, Cash, future providers) ── */

export type PaymentProvider = 'telebirr' | 'cash' | string; // open union: registry-driven

export type PaymentStatus =
  | 'pending' // created, awaiting user action (open Telebirr, hand over cash)
  | 'processing' // Telebirr: user redirected, awaiting provider confirmation
  | 'held' // digital payment captured, held in escrow until job completion
  | 'released' // paid out to professional (job done & confirmed)
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  requestId?: string;
  payerUid: string;
  payeeUid: string;
  amount: number;
  currency: 'ETB';
  /** which adapter handled this payment — never branch UI on this directly */
  provider: PaymentProvider;
  method: 'digital' | 'cash';
  status: PaymentStatus;
  /** adapter reference (Telebirr order/transaction id, receipt no for cash) */
  providerRef?: string;
  payerPhone?: string;
  failureReason?: string;
  initiatedAt: number;
  updatedAt: number;
  releasedAt?: number;
  confirmedBy?: string; // uid that confirmed a cash collection
  /** fee split recorded at release time */
  platformFee?: number;
  proNet?: number;
  /** cancellation settlement (status 'refunded') */
  refundAmount?: number;
  proAmount?: number; // portion kept by the pro on a late cancellation (separate released record)
}

/* ── Favorites ── */

export interface FavoriteItem {
  id: string;
  customerId: string;
  proId: string;
  createdAt: number;
}
