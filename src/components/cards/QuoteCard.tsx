import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../state/ThemeContext';
import type { Quote } from '../../models/types';
import { QUOTE_STATUS } from '../../constants/status';
import { TABULAR } from '../../config/theme';
import { formatDate, formatTime, money, relativeTime } from '../../utils/format';

export function QuoteCard({
  quote,
  onAccept,
  onDecline,
  onMessage,
  onSeeReviews,
}: {
  quote: Quote;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  onSeeReviews?: () => void;
}) {
  const { palette } = useTheme();
  const status = QUOTE_STATUS[quote.status];
  const canAct = quote.status === 'sent' && quote.expiresAt > Date.now();
  const accent =
    quote.status === 'accepted' || quote.expiresAt <= Date.now() && quote.status === 'sent'
      ? palette.success
      : quote.status === 'declined'
        ? palette.danger
        : palette.accent;
  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: accent }}>
      <View style={styles.top}>
        <Avatar name={quote.proName} uri={quote.proPhotoURL} size={42} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15.5, fontWeight: '700' }}>
            {quote.proName}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 1 }}>
            {quote.serviceName} · sent {relativeTime(quote.createdAt)}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      {onSeeReviews ? (
        <Pressable onPress={onSeeReviews} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '700' }}>★ See reviews →</Text>
        </Pressable>
      ) : null}

      <View style={[styles.lines, { borderTopColor: palette.border, borderBottomColor: palette.border }]}>
        {quote.lines.map((l) => (
          <View key={l.label} style={styles.line}>
            <Text style={{ color: palette.textMuted, fontSize: 13.5, flex: 1 }}>{l.label}</Text>
            <Text style={{ color: palette.text, fontSize: 13.5, fontWeight: '600' }}>{money(l.amount)}</Text>
          </View>
        ))}
        {quote.discount > 0 ? (
          <View style={styles.line}>
            <Text style={{ color: palette.success, fontSize: 13.5, flex: 1 }}>Discount</Text>
            <Text style={{ color: palette.success, fontSize: 13.5, fontWeight: '700' }}>-{money(quote.discount)}</Text>
          </View>
        ) : null}
        <View style={styles.line}>
          <Text style={{ color: palette.textMuted, fontSize: 13.5, flex: 1 }}>VAT ({quote.taxPct}%)</Text>
          <Text style={{ color: palette.text, fontSize: 13.5, fontWeight: '600' }}>{money(quote.tax)}</Text>
        </View>
        <View style={[styles.line, { marginTop: 4 }]}>
          <Text style={{ color: palette.text, fontSize: 15, fontWeight: '800', flex: 1 }}>Total</Text>
          <Text style={[{ color: palette.primary, fontSize: 17, fontWeight: '800' }, TABULAR]}>{money(quote.total)}</Text>
        </View>
      </View>

      {quote.proposedSlot ? (
        <View style={styles.slot}>
          <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600' }}>
            📅 {formatDate(quote.proposedSlot.date)} · {formatTime(quote.proposedSlot.start)}–{formatTime(quote.proposedSlot.end)}
          </Text>
        </View>
      ) : null}
      {quote.note ? (
        <Text numberOfLines={3} style={{ color: palette.textMuted, fontSize: 13, lineHeight: 18, marginTop: 6 }}>
          “{quote.note}”
        </Text>
      ) : null}

      {canAct ? (
        <View style={styles.actions}>
          {onDecline ? (
            <Button label="Decline" variant="ghost" size="sm" onPress={onDecline} style={{ flex: 1 }} />
          ) : null}
          {onMessage ? (
            <Button label="Chat" variant="secondary" size="sm" onPress={onMessage} style={{ flex: 1 }} />
          ) : null}
          {onAccept ? (
            <Button label={`Accept · ${money(quote.total)}`} size="sm" onPress={onAccept} style={{ flex: 1.6 }} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  lines: { marginTop: 12, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2.5 },
  slot: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: 'rgba(13,110,84,0.08)' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
});
