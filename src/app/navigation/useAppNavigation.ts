import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/** Typed navigation hook for stack-level navigation from anywhere. */
export function useAppNavigation(): NativeStackNavigationProp<RootStackParamList> {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}
