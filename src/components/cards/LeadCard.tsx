import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useTheme } from '../../state/ThemeContext';
import type { Lead, ServiceRequest } from '../../models/types';
import { LEAD_STATE, URGENCY_LABEL } from '../../constants/status';
import { money, relativeTime } from '../../utils/format';
import { getService } from '../../config/seed/taxonomy';

const KEY_ANSWER_LABELS: Record<string, string> = {
  bedrooms: 'BR', bathrooms: 'BA', approx_size: 'm²', hours: 'hrs', guests: 'guests', units: 'units',
};

/** Human tags for the most quote-relevant answers (bedrooms, bathrooms, size…). */
function answerTags(request?: ServiceRequest): string[] {
  if (!request) return [];
  const tags: string[] = [];
  for (const [key, value] of Object.entries(request.answers)) {
    const suffix = KEY_ANSWER_LABELS[key];
    if (!suffix || value === undefined || value === '') continue;
    tags.push(`${value} ${suffix}`);
  }
  return tags.slice(0, 3);
}

export function LeadCard({ lead, request, onPress }: { lead: Lead; request?: ServiceRequest; onPress: () => void }) {
  const { palette } = useTheme();
  const keyAnswers = answerTags(request);
  const state = LEAD_STATE[lead.state];
  // score intensity: strong green ≥80, amber 60–79, muted below
  // soft gold score pill — calm, premium hierarchy
  const scoreColor = palette.accent; void lead;
  const urgent = request?.when.urgency === 'emergency' || request?.when.urgency === 'today';
  return (
    <Card onPress={onPress} style={{ padding: 18 }}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15.5, fontWeight: '700', flex: 1 }}>
              {request?.serviceName ?? 'Service request'}
            </Text>
            {urgent ? <Badge label="⚡ Urgent" tone="danger" /> : null}
          </View>
          <Text numberOfLines={2} style={{ color: palette.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            {request?.summaryText}
          </Text>
          {keyAnswers.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
              {keyAnswers.map((a) => (
                <View key={a} style={[styles.tag, { borderColor: palette.border }]}>
                  <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '700' }}>{a}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={[styles.score, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
          <Text style={{ color: scoreColor, fontSize: 15, fontWeight: '900' }}>{Math.round(lead.score)}</Text>
          <Text style={{ color: scoreColor, fontSize: 9.5, fontWeight: '800', opacity: 0.8, letterSpacing: 0.4 }}>MATCH</Text>
        </View>
      </View>
      <View style={[styles.foot, { borderTopColor: palette.border }]}>
        <Badge label={state.label} tone={state.tone} />
        <Text style={{ color: palette.textMuted, fontSize: 12.5, marginLeft: 10, flex: 1 }} numberOfLines={1}>
          {request
            ? `${request.customerName.split(' ')[0]} · ${request.location.subcity} · ${relativeTime(request.createdAt)}`
            : ''}
        </Text>
        {request ? (
          <Text style={{ color: palette.text, fontSize: 12.5, fontWeight: '700' }}>
            market from {money(getService(request.serviceId)?.fromPrice ?? 500)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
  score: { alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7, marginLeft: 10 },
  tag: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  foot: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
});
