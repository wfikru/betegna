import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Deep links: betegna://request/123 and https://betegna.app/request/123 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'https://betegna.app'],
  config: {
    screens: {
      RequestDetail: 'request/:requestId',
      ChatThread: 'conversation/:conversationId',
      BookingDetail: 'booking/:bookingId',
      ProProfile: 'professional/:proId',
      LeadsTab: 'leads',
      Notifications: 'notifications',
      Welcome: '',
    },
  },
};
