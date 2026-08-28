import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';
import type { Message } from '../../models/types';
import { money, formatDate, formatTime } from '../../utils/format';
import type { AppointmentPayload, BookingPayload, QuotePayload } from '../../models/types';

function ReadTick({ read, mine }: { read: boolean; mine: boolean }) {
  const { palette } = useTheme();
  if (!mine) return null;
  return (
    <Ionicons
      name={read ? 'checkmark-done' : 'checkmark'}
      size={13}
      color={read ? palette.info : palette.textMuted}
      style={{ marginLeft: 4 }}
    />
  );
}

export function MessageBubble({ message, mine, onAcceptAppointment }: { message: Message; mine: boolean; onAcceptAppointment?: (payload: AppointmentPayload) => void }) {
  const { palette, radius } = useTheme();

  if (message.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <View style={[styles.system, { backgroundColor: palette.surfaceAlt }]}>
          <Text style={{ color: palette.textMuted, fontSize: 12, textAlign: 'center' }}>
            ⚙️ {message.text ?? systemText(message)} · {formatTime(new Date(message.createdAt).toTimeString().slice(0, 5))}
          </Text>
        </View>
      </View>
    );
  }

  if (message.type === 'quote' && message.payload) {
    const p = message.payload as QuotePayload;
    return (
      <View style={[styles.bubbleBase, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }, { backgroundColor: palette.accentSoft, borderRadius: radius.lg }]}>
        <Text style={{ color: palette.onAccent, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4 }}>QUOTE</Text>
        <Text style={{ color: palette.text, fontSize: 14, marginTop: 4 }}>{p.summary}</Text>
        <Text style={{ color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 4 }}>{money(p.total)}</Text>
        <Text style={{ color: palette.textMuted, fontSize: 11.5, marginTop: 2 }}>See the full quote on the request page</Text>
      </View>
    );
  }

  if (message.type === 'appointment' && message.payload) {
    const p = message.payload as AppointmentPayload;
    return (
      <View style={[styles.bubbleBase, { alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: palette.primarySoft, borderRadius: radius.lg }]}>
        <Text style={{ color: palette.primary, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4 }}>📅 PROPOSED TIME</Text>
        <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700', marginTop: 4 }}>
          {formatDate(p.date)} · {formatTime(p.start)}–{formatTime(p.end)}
        </Text>
        {message.text ? (
          <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3 }}>{message.text}</Text>
        ) : null}
        {p.status === 'proposed' && onAcceptAppointment ? (
          <Pressable
            onPress={() => onAcceptAppointment(p)}
            accessibilityRole="button"
            accessibilityLabel="Accept time and book"
            style={({ pressed }) => [
              styles.acceptBtn,
              { backgroundColor: pressed ? 'rgba(11,107,69,0.85)' : palette.primary, borderRadius: 10 },
            ]}
          >
            <Ionicons name="calendar" size={15} color={palette.onPrimary} />
            <Text style={{ color: palette.onPrimary, fontWeight: '800', fontSize: 13.5, marginLeft: 6 }}>
              Accept · book the job
            </Text>
          </Pressable>
        ) : (
          <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 6, fontWeight: '700' }}>
            {p.status === 'accepted' ? 'Accepted ✓' : p.status === 'declined' ? 'Declined' : ''}
          </Text>
        )}
      </View>
    );
  }

  if (message.type === 'booking' && message.payload) {
    const p = message.payload as BookingPayload;
    return (
      <View style={styles.systemWrap}>
        <View style={[styles.system, { backgroundColor: palette.primarySoft }]}>
          <Text style={{ color: palette.primary, fontSize: 12.5, fontWeight: '700', textAlign: 'center' }}>
            ✅ Booking confirmed — see Booking details
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleBase, { alignSelf: mine ? 'flex-end' : 'flex-start' }, {
      backgroundColor: mine ? palette.primary : palette.surface,
      borderRadius: radius.lg,
      borderWidth: mine ? 0 : 1,
      borderColor: palette.border,
    }]}>
      {message.imageURL ? (
        <Image source={{ uri: message.imageURL }} style={styles.image} />
      ) : null}
      {message.text ? (
        <Text style={{ color: mine ? palette.onPrimary : palette.text, fontSize: 15, lineHeight: 21 }}>
          {message.text}
        </Text>
      ) : null}
      <View style={styles.meta}>
        <Text style={{ color: mine ? 'rgba(255,255,255,0.75)' : palette.textMuted, fontSize: 10.5 }}>
          {formatTime(new Date(message.createdAt).toTimeString().slice(0, 5))}
        </Text>
        <ReadTick read={message.readBy.length > 1} mine={mine} />
      </View>
    </View>
  );
}

function systemText(m: Message): string {
  return m.text ?? 'System event';
}

const styles = StyleSheet.create({
  acceptBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 13, paddingVertical: 9 },
  systemWrap: { alignItems: 'center', marginVertical: 6 },
  system: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, maxWidth: '85%' },
  bubbleBase: { maxWidth: '80%', paddingHorizontal: 13, paddingVertical: 9, marginVertical: 3 },
  image: { width: 210, height: 140, borderRadius: 10, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
});
