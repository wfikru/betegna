import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { EmptyState } from '../../components/common/EmptyState';
import { RequestCard } from '../../components/cards/RequestCard';
import { FadeIn } from '../../components/common/Motion';
import { SkeletonList } from '../../components/common/Skeleton';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { ServiceRequest } from '../../models/types';
import { subscribeRequests } from '../../services/requests';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';

export default function RequestsScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeRequests(user.uid, setRequests);
  }, [user]);

  const active = (requests ?? []).filter((r) => !['completed', 'cancelled'].includes(r.status));
  const past = (requests ?? []).filter((r) => ['completed', 'cancelled'].includes(r.status));

  const [tab, setTab] = useState<'active' | 'past'>('active');

  const visible = tab === 'active' ? active : past;

  return (
    <Screen padded={false}>
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800' }}>{t('nav.requests')}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 4, marginBottom: 16, lineHeight: 20 }}>
            Describe it once — we do the searching. Post as many as you need.
          </Text>

          {/* Active / Past segmented tabs */}
          <View style={[styles.tabs, { backgroundColor: palette.surfaceAlt }]}>
            {([
              ['active', `Active${active.length ? ` · ${active.length}` : ''}`],
              ['past', `Past${past.length ? ` · ${past.length}` : ''}`],
            ] as ['active' | 'past', string][]).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                accessibilityRole="tab"
                aria-selected={tab === id}
                style={[styles.tab, { backgroundColor: tab === id ? palette.surface : 'transparent' }]}
              >
                <Text style={{ color: tab === id ? palette.primary : palette.textMuted, fontSize: 13.5, fontWeight: '800' }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {requests === null ? (
            <SkeletonList rows={3} />
          ) : visible.length ? (
            visible.map((r, i) => (
              <FadeIn key={r.id} delay={i * 70}>
                <RequestCard request={r} onPress={() => navigation.navigate('RequestDetail', { requestId: r.id })} />
              </FadeIn>
            ))
          ) : (
            <EmptyState
              icon={tab === 'active' ? 'clipboard-outline' : 'archive-outline'}
              title={tab === 'active' ? t('request.empty') : 'Nothing here yet'}
              message={tab === 'active' ? t('request.emptyCta') : 'Completed and cancelled requests will appear in this tab.'}
            />
          )}
        </ScrollView>

        {/* floating action button */}
        <Pressable
          onPress={() => navigation.navigate('RequestWizard', undefined)}
          accessibilityRole="button"
          accessibilityLabel="New request"
          style={({ pressed }) => [
            styles.fab,
          // raised above the floating tab bar
            { backgroundColor: pressed ? palette.primaryDark : palette.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Ionicons name="add" size={28} color={palette.onPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({


  tabs: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  fab: { position: 'absolute', right: 18, bottom: 104, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#1C2A23', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, color: '#8A9B93', marginBottom: 10 },
});
