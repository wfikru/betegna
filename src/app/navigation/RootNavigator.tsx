import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../../state/AuthContext';
import { useTheme } from '../../state/ThemeContext';
import { t } from '../../i18n';
import type { RootStackParamList } from './types';
import { linking } from './linking';

import WelcomeScreen from '../../screens/auth/WelcomeScreen';
import LoginScreen from '../../screens/auth/LoginScreen';
import SignUpScreen from '../../screens/auth/SignUpScreen';
import ProSignUpScreen from '../../screens/auth/ProSignUpScreen';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';

import HomeScreen from '../../screens/customer/HomeScreen';
import RequestsScreen from '../../screens/customer/RequestsScreen';
import BookingsScreen from '../../screens/customer/BookingsScreen';
import RequestWizardScreen from '../../screens/customer/RequestWizardScreen';
import MatchingScreen from '../../screens/customer/MatchingScreen';
import RequestDetailScreen from '../../screens/customer/RequestDetailScreen';
import ProProfileScreen from '../../screens/customer/ProProfileScreen';
import BookingDetailScreen from '../../screens/shared/BookingDetailScreen';
import ReviewComposerScreen from '../../screens/customer/ReviewComposerScreen';
import FavoritesScreen from '../../screens/customer/FavoritesScreen';

import ProDashboardScreen from '../../screens/professional/ProDashboardScreen';
import LeadsScreen from '../../screens/professional/LeadsScreen';
import LeadDetailScreen from '../../screens/professional/LeadDetailScreen';
import QuoteComposerScreen from '../../screens/professional/QuoteComposerScreen';
import ProCalendarScreen from '../../screens/professional/ProCalendarScreen';
import ProProfileEditScreen from '../../screens/professional/ProProfileEditScreen';
import ProOnboardingScreen from '../../screens/professional/ProOnboardingScreen';

import ChatListScreen from '../../screens/shared/ChatListScreen';
import ChatThreadScreen from '../../screens/shared/ChatThreadScreen';
import NotificationsScreen from '../../screens/shared/NotificationsScreen';
import PaymentsScreen from '../../screens/shared/PaymentsScreen';
import ProfileScreen from '../../screens/shared/ProfileScreen';
import { NotificationBell } from '../../components/common/NotificationBell';
import { navigationRef } from './navigationRef';
import { consumeRoleLanding } from '../../state/roleLanding';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/** Floating curved bottom bar — inset from screen edges, elevated above content. */
function useFloatingTabOptions(insets: { bottom: number }) {
  const { palette } = useTheme();
  return {
    headerShown: false,
    tabBarActiveTintColor: palette.primary,
    tabBarInactiveTintColor: palette.textMuted,
    tabBarHideKeyboard: true,
    tabBarLabelStyle: { fontSize: 10.5, fontWeight: '800' as const, marginTop: 2 },
    tabBarIconStyle: { marginTop: 6 },
    tabBarStyle: {
      position: 'absolute' as const,
      left: 14,
      right: 14,
      bottom: insets.bottom > 0 ? insets.bottom + 4 : 12,
      height: 66,
      borderRadius: 26,
      borderCurve: 'continuous' as const,
      borderWidth: 1,
      borderTopWidth: 1,
      borderColor: palette.border,
      borderTopColor: palette.border,
      backgroundColor: palette.surface,
      paddingTop: 4,
      paddingBottom: 6,
      paddingHorizontal: 6,
      overflow: 'hidden' as const,
      elevation: 12,
      shadowColor: '#2A2118',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
  };
}

function tabIcon(name: keyof typeof Ionicons.glyphMap, focused: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={focused ? focused : name} size={size} color={color} />
  );
}

function CustomerTabs() {
  const insets = useSafeAreaInsets();
  const [initialRouteName] = React.useState(() => consumeRoleLanding() ?? 'HomeTab');
  return (
    <Tab.Navigator initialRouteName={initialRouteName} screenOptions={useFloatingTabOptions(insets)}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t('nav.home'), tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tab.Screen name="RequestsTab" component={RequestsScreen} options={{ title: t('nav.requests'), tabBarIcon: tabIcon('clipboard-outline', 'clipboard') }} />
      <Tab.Screen name="MessagesTab" component={ChatListScreen} options={{ title: t('nav.messages'), tabBarIcon: tabIcon('chatbubble-outline', 'chatbubble') }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline', 'person') }} />
    </Tab.Navigator>
  );
}

function ProTabs() {
  const insets = useSafeAreaInsets();
  const [initialRouteName] = React.useState(() => consumeRoleLanding() ?? 'DashTab');
  return (
    <Tab.Navigator initialRouteName={initialRouteName} screenOptions={useFloatingTabOptions(insets)}>
      <Tab.Screen name="DashTab" component={ProDashboardScreen} options={{ title: t('pro.dashboard'), tabBarIcon: tabIcon('stats-chart-outline', 'stats-chart') }} />
      <Tab.Screen name="LeadsTab" component={LeadsScreen} options={{ title: t('nav.leads'), tabBarIcon: tabIcon('flash-outline', 'flash') }} />
      <Tab.Screen name="CalendarTab" component={ProCalendarScreen} options={{ title: t('nav.calendar'), tabBarIcon: tabIcon('calendar-outline', 'calendar') }} />
      <Tab.Screen name="ProMessagesTab" component={ChatListScreen} options={{ title: t('nav.messages'), tabBarIcon: tabIcon('chatbubble-outline', 'chatbubble') }} />
      <Tab.Screen name="ProProfileTab" component={ProfileScreen} options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline', 'person') }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ProSignUp" component={ProSignUpScreen} />
      <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  const { palette } = useTheme();
  const { activeRole } = useAuth();
  const isPro = activeRole === 'professional';
  return (
    <Stack.Navigator
      key={activeRole} // remount shells on role switch
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
        animation: 'slide_from_right',
      }}
    >
      {isPro ? (
        <Stack.Screen name="ProTabs" component={ProTabs} />
      ) : (
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      )}
      <Stack.Group>
        <Stack.Screen name="RequestWizard" component={RequestWizardScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Matching" component={MatchingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Bookings" component={BookingsScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen name="ProProfile" component={ProProfileScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="ReviewComposer" component={ReviewComposerScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
        <Stack.Screen name="QuoteComposer" component={QuoteComposerScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ProOnboarding" component={ProOnboardingScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ProCalendar" component={ProCalendarScreen} />
        <Stack.Screen name="ProProfileEdit" component={ProProfileEditScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Payments" component={PaymentsScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

/** Deepest focused route name across nested navigators (from the container's onStateChange payload). */
function leafRouteNameOf(state: unknown): string {
  let leaf = '';
  let current = state as { routes?: { name?: string; state?: unknown }[]; index?: number } | undefined;
  while (current && current.routes) {
    const route = current.routes[current.index ?? 0];
    if (!route) break;
    leaf = route.name ?? leaf;
    current = route.state as typeof current;
  }
  return leaf;
}

export default function RootNavigator() {
  const [leafRoute, setLeafRoute] = React.useState('');
  const { user, loading } = useAuth();
  const { palette, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: palette.primary,
      notification: palette.accent,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={navTheme}
      onStateChange={(state) => setLeafRoute(leafRouteNameOf(state))}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        {user ? <MainStack /> : <AuthStack />}
        <NotificationBell leafRoute={leafRoute} />
      </View>
    </NavigationContainer>
  );
}
