import { t } from '../../i18n';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import type { Lead, ServiceRequest } from '../../models/types';
import { getRequest, setLeadState, subscribeLeads } from '../../services/requests';
import { ensureConversationForLead } from '../../services/chat';
import { getService } from '../../config/seed/taxonomy';
import { summarizeServiceAnswers } from '../../features/services/questionnaireEngine';
import { LEAD_STATE, URGENCY_LABEL } from '../../constants/status';
import { relativeTime } from '../../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LeadDetail'>;

export default function LeadDetailScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [request, setRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    // lead list screen passed the id; resolve via subscription to pick up latest state
    if (!user) return;
    let latest: Lead | undefined;
    const unsub = subscribeLeads(user.uid, (leads) => {
      latest = leads.find((l) => l.id === route.params.leadId);
      setLead(latest ?? null);
      if (latest && !request) void getRequest(latest.requestId).then(setRequest);
    });
    return unsub;
  }, [user, route.params.leadId, request]);

  if (!lead || !request) {
    return (
      <Screen>
        <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: 120 }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  const service = getService(request.serviceId);
  const rows = service ? summarizeServiceAnswers(service, request.answers) : [];
  const state = LEAD_STATE[lead.state];
  const urgent = request.when.urgency === 'emergency' || request.when.urgency === 'today';
  const requestClosed = ['booked', 'in_progress', 'completed', 'cancelled'].includes(request.status);

  const openChat = async () => {
    if (!user) return;
    await setLeadState(lead.id, lead.state === 'new' ? 'contacted' : lead.state);
    const conv = await ensureConversationForLead(user, request);
    navigation.navigate('ChatThread', { conversationId: conv.id, title: request.customerName });
  };

  return (
    <Screen scroll padded={false}>
      <View style={[styles.header, { backgroundColor: palette.surface }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: palette.text, fontSize: 21, fontWeight: '800' }}>{request.serviceName}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3 }}>
              {request.customerName} · {request.location.subcity} · {relativeTime(request.createdAt)}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={{ color: palette.primary, fontSize: 16, fontWeight: '900' }}>{Math.round(lead.score)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          <Badge label={state.label} tone={state.tone} />
          <Badge label={URGENCY_LABEL[request.when.urgency]} tone={urgent ? 'danger' : 'neutral'} />
          {request.when.preferredDate ? <Badge label={request.when.preferredDate} tone="neutral" /> : null}
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Card_ palette={palette} title="What they need">
          <Text style={{ color: palette.text, fontSize: 14.5, lineHeight: 21 }}>
            {request.summaryText || request.serviceName}
          </Text>
          {rows.length ? (
            <View style={{ marginTop: 12 }}>
              {rows.map((r) => (
                <View key={r.label} style={styles.answerRow}>
                  <Text style={{ color: palette.textMuted, fontSize: 13, flex: 1 }}>{r.label}</Text>
                  <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' }}>{r.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {service ? (
            <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 10 }}>
              Market starting price: {service.fromPrice.toLocaleString()} ETB {service.priceUnit === 'hour' ? '/hr' : ''}
            </Text>
          ) : null}
        </Card_>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10 }}>
          <Button label="Chat with customer" variant="secondary" onPress={openChat} icon="chatbubble-outline" style={{ flex: 1 }} />
          {!requestClosed ? (
            <Button
              label="Decline"
              variant="ghost"
              onPress={async () => {
                await setLeadState(lead.id, 'lost');
                navigation.goBack();
              }}
              style={{ flex: 0.6 }}
            />
          ) : null}
        </View>
        {requestClosed ? (
          <Button label="View booking" variant="secondary" onPress={() => navigation.goBack()} icon="calendar-outline" />
        ) : lead.state === 'quoted' ? (
          <>
            <View style={[styles.quotedNote, { backgroundColor: palette.primarySoft, borderRadius: 12 }]}>
              <Ionicons name="checkmark-done" size={17} color={palette.primary} />
              <Text style={{ color: palette.text, fontSize: 13, marginLeft: 9, flex: 1, lineHeight: 18 }}>
                Quote sent — the customer has been notified. Sending again will <Text style={{ fontWeight: '800' }}>update</Text> your existing quote (it never duplicates).
              </Text>
            </View>
            <View style={{ height: 10 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label="Message customer"
                variant="ghost"
                onPress={openChat}
                icon="chatbubble-outline"
                style={{ flex: 1 }}
              />
              <Button label="Update quote" variant="secondary" onPress={() => navigation.navigate('QuoteComposer', { leadId: lead.id })} icon="create-outline" style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <Button
            label={t('pro.sendQuote')}
            onPress={() => navigation.navigate('QuoteComposer', { leadId: lead.id })}
            size="lg"
            icon="pricetag-outline"
          />
        )}
        <View style={{ height: 10 }} />
      </View>
    </Screen>
  );
}

function Card_({ children, title, palette: _p }: { children: React.ReactNode; title: string; palette: ReturnType<typeof useTheme>['palette'] }) {
  const { palette } = useTheme();
  return (
    <View style={[cardStyles.wrap, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <Text style={{ color: palette.textMuted, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 }}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth * 1.5 },
  scoreBadge: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  answerRow: { flexDirection: 'row', paddingVertical: 5 },
  quotedNote: { flexDirection: 'row', alignItems: 'center', padding: 13 },
});

const cardStyles = StyleSheet.create({ wrap: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 } });

