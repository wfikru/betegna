import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Ref to the root NavigationContainer — lets global components (e.g. the
 * notification bell overlay, push-notification taps, deep links) navigate
 * WITHOUT being inside a screen/navigator (where useNavigation would throw).
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
