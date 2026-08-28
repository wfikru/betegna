import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { BackBar } from '../../components/common/BackBar';
import { Chip } from '../../components/common/Chip';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Lead, QuoteLineItem, ServiceRequest } from '../../models/types';
import { getRequest, subscribeLeads } from '../../services/requests';
import { getPro } from '../../services/professionals';
import { sendQuoteAsPro } from '../../services/quotes';
import { computeQuoteTotals } from '../../features/quotes/quoteMath';
import { getService } from '../../config/seed/taxonomy';
import { addDaysISO, formatDate, formatTime, money } from '../../utils/format';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuoteComposer'>;

export default function QuoteComposerScreen({ navigation, route }: Props) {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [request, setRequest] = useState<ServiceRequest | null>(null);

  const [lines, setLines] = useState<QuoteLineItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [taxPct, setTaxPct] = useState('15');
  const [duration, setDuration] = useState('3');
  // when the request says how big the job is, pre-fill a realistic estimate
  useEffect(() => {
    if (!request) return;
    const bedrooms = Number(request.answers['bedrooms'] ?? 0);
    if (bedrooms > 0) {
      const hrs = Math.max(2, Math.round(bedrooms * 1.5 + 1));
      setDuration(String(hrs));
    }
  }, [request]);
  const [note, setNote] = useState('');
  const [dayOffset, setDayOffset] = useState(1);
  const [start, setStart] = useState('10:00');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeLeads(user.uid, (leads) => {
      const found = leads.find((l) => l.id === route.params.leadId);
      setLead(found ?? null);
      if (found && !request) {
        void getRequest(found.requestId).then((r) => {
          setRequest(r);
          if (r) {
            const svc = getService(r.serviceId);
            setLines([
              { label: `Labor — ${r.serviceName}`, kind: 'labor', amount: svc?.fromPrice ?? 800 },
              { label: 'Materials & supplies', kind: 'material', amount: Math.round(((svc?.fromPrice ?? 800) * 0.2) / 50) * 50 },
            ]);
            if (r.when.preferredDate) {
              const diff = Math.round((new Date(`${r.when.preferredDate}T00:00:00`).getTime() - Date.now()) / 86400000);
              setDayOffset(Math.max(0, diff));
            }
            const t = r.when.preferredTime;
            if (t === 'morning') setStart('09:00');
            else if (t === 'afternoon') setStart('14:00');
            else if (t === 'evening') setStart('17:00');
            else if (t && /^\d{2}:\d{2}$/.test(t)) setStart(t);
          }
        });
      }
    });
  }, [user, route.params.leadId, request]);

  const totals = useMemo(
    () => computeQuoteTotals(lines, Number(discount) || 0, Number(taxPct) || 0),
    [lines, discount, taxPct],
  );

  const setLine = (i: number, patch: Partial<QuoteLineItem>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const send = async () => {
    if (!user || !lead) return;
    setSending(true);
    try {
      const pro = await getPro(user.uid);
      if (!pro) throw new Error('profile missing');
      const date = addDaysISO(dayOffset);
      const [h, m] = start.split(':').map(Number);
      const endH = Math.min(23, (h ?? 10) + (Number(duration) || 2));
      await sendQuoteAsPro(pro, lead, {
        lines: lines.filter((l) => l.label.trim() && l.amount > 0),
        discount: Number(discount) || 0,
        taxPct: Number(taxPct) || 0,
        durationHours: Number(duration) || undefined,
        slot: { date, start, end: `${String(endH).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}` },
        note: note.trim() || undefined,
      });
      setSent(true);
      setTimeout(() => navigation.goBack(), 1400);
    } catch (e) {
      console.error(e);
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginTop: 110 }}>
          <Text style={{ fontSize: 56 }}>📨</Text>
          <Text style={{ color: palette.text, fontSize: 22, fontWeight: '800', marginTop: 16 }}>Quote sent!</Text>
          <Text style={{ color: palette.textMuted, fontSize: 14.5, marginTop: 8, textAlign: 'center', lineHeight: 21 }}>
            The customer has been notified. You'll hear back here and in Messages.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackBar fallbackTab="LeadsTab" />
      <Text style={{ color: palette.text, fontSize: 24, fontWeight: '800' }}>{t('pro.quoteComposer')}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 4, marginBottom: 18 }}>
        {request ? `${request.serviceName} for ${request.customerName} · ${request.location.subcity}` : t('common.loading')}
      </Text>

      <Text style={styles.label}>{t('pro.lineItems')}</Text>
      {lines.map((l, i) => (
        <View key={i} style={[styles.lineRow, { borderColor: palette.border, borderRadius: radius.md }]}>
          <TextInput
            value={l.label}
            onChangeText={(v) => setLine(i, { label: v })}
            placeholder="Item description"
            placeholderTextColor={palette.textMuted}
            style={{ flex: 1, color: palette.text, fontSize: 14 }}
          />
          <TextInput
            value={String(l.amount)}
            onChangeText={(v) => setLine(i, { amount: Number(v.replace(/[^0-9]/g, '')) || 0 })}
            keyboardType="number-pad"
            style={{ color: palette.text, fontSize: 14, fontWeight: '700', width: 78, textAlign: 'right' }}
          />
          <Pressable onPress={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={palette.textMuted} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => setLines((prev) => [...prev, { label: '', kind: 'fee', amount: 0 }])}
        style={[styles.addLine, { borderRadius: radius.md, borderColor: palette.border }]}
      >
        <Ionicons name="add" size={17} color={palette.primary} />
        <Text style={{ color: palette.primary, fontSize: 13.5, fontWeight: '700', marginLeft: 6 }}>{t('pro.addLine')}</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Discount (ETB)</Text>
          <TextInput
            value={discount}
            onChangeText={(v) => setDiscount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={palette.textMuted}
            style={[styles.smallInput, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>VAT %</Text>
          <TextInput
            value={taxPct}
            onChangeText={(v) => setTaxPct(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={[styles.smallInput, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Hours</Text>
          <TextInput
            value={duration}
            onChangeText={(v) => setDuration(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={[styles.smallInput, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
          />
        </View>
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>{t('pro.proposedSlot')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 5, 7].map((d) => (
          <Chip key={d} label={d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : formatDate(addDaysISO(d)).split(',')[0] ?? ''} selected={dayOffset === d} onPress={() => setDayOffset(d)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
        {['08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00'].map((s) => (
          <Chip key={s} label={formatTime(s)} selected={start === s} onPress={() => setStart(s)} />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>{t('pro.note')}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="e.g. Price includes materials and transport. Valid for 3 days."
        placeholderTextColor={palette.textMuted}
        style={[styles.noteInput, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
      />

      {/* live totals */}
      <View style={[styles.totals, { borderRadius: radius.lg, backgroundColor: palette.primary }]}>
        <Row label="Subtotal" value={totals.subtotal.toLocaleString()} light />
        {totals.discount > 0 ? <Row label="Discount" value={`-${totals.discount.toLocaleString()}`} light /> : null}
        <Row label={`VAT (${taxPct || 0}%)`} value={totals.tax.toLocaleString()} light />
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', marginTop: 8, paddingTop: 10 }}>
          <Row label="Total (ETB)" value={totals.total.toLocaleString()} light big />
        </View>
      </View>

      <Button label={`Send quote · ${money(totals.total)}`} onPress={send} loading={sending} size="lg" icon="send-outline" />
      <View style={{ height: 8 }} />
      <Text style={{ color: palette.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
        Valid for 3 days · Customer accepts right in chat
      </Text>
    </Screen>
  );
}

function Row({ label, value, light, big }: { label: string; value: string; light?: boolean; big?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
      <Text style={{ color: light ? 'rgba(255,255,255,0.85)' : palette.textMuted, fontSize: big ? 15 : 13.5, flex: 1 }}>{label}</Text>
      <Text style={{ color: light ? '#fff' : palette.text, fontSize: big ? 19 : 13.5, fontWeight: big ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13.5, fontWeight: '800', marginBottom: 6, marginTop: 4 },
  lineRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8 },
  addLine: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', paddingVertical: 10, paddingHorizontal: 12 },
  smallInput: { borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14 },
  noteInput: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, minHeight: 76, textAlignVertical: 'top', fontSize: 14 },
  totals: { padding: 16, marginTop: 16, marginBottom: 16 },
});
