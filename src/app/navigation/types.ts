import type { Frequency, Urgency } from '../../models/types';

export type RootStackParamList = {
  // auth
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ProSignUp: undefined;
  Forgot: undefined;

  // tab routes (for cross-shell navigation)
  HomeTab: undefined;
  RequestsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
  DashTab: undefined;
  LeadsTab: undefined;
  CalendarTab: undefined;
  ProProfileTab: undefined;

  // tab containers (navigating into a tab from a stack screen)
  CustomerTabs: { screen: 'HomeTab' | 'RequestsTab' | 'MessagesTab' | 'ProfileTab' } | undefined;
  ProTabs: { screen: 'DashTab' | 'LeadsTab' | 'CalendarTab' | 'ProMessagesTab' | 'ProProfileTab' } | undefined;

  // customer shell

  RequestWizard: {
    serviceId?: string;
    summaryText?: string;
    urgency?: Urgency;
    frequency?: Frequency;
    subcity?: string;
  } | undefined;
  Matching: { requestId: string } | undefined;
  Bookings: undefined;
  RequestDetail: { requestId: string };
  ProProfile: { proId: string; requestId?: string };
  BookingDetail: { bookingId: string };
  ReviewComposer: { bookingId: string; proId: string; proName: string };
  Favorites: undefined;

  // professional shell
  LeadDetail: { leadId: string };
  QuoteComposer: { leadId: string };
  ProOnboarding: undefined;
  ProCalendar: undefined;
  ProProfileEdit: undefined;

  // shared
  Notifications: undefined;
  Payments: undefined;
  ChatThread: { conversationId: string; title?: string };
};
