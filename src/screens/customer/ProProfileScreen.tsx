import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Rating } from '../../components/common/Rating';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { ProfessionalProfile, Review } from '../../models/types';
import { getPro, subscribePro } from '../../services/professionals';
import { subscribeReviewsForPro } from '../../services/reviews';
import { toggleFavorite } from '../../services/favorites';
import { ensureConversation } from '../../services/chat';
import { money, relativeTime } from '../../utils/format';
import { PRICE_UNIT_LABEL } from '../../config/brand';
import { WEEKDAYS } from '../../constants/status';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProProfile'>;

export default function ProProfileScreen({ navigation, route }: Props) {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const [pro, setPro] = useState<ProfessionalProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const unsub = subscribePro(route.params.proId, setPro);
    return unsub;
  }, [route.params.proId]);

  useEffect(() => {
    return subscribeReviewsForPro(route.params.proId, setReviews);
  }, [route.params.proId]);

  if (!pro) return <Screen />;
  const initialsName = pro.displayName;

  const startChat = async () => {
    if (!user) return;
    const conv = await ensureConversation(user, pro.uid, route.params.requestId);
    navigation.navigate('ChatThread', { conversationId: conv.id });
  };

  return (
    <Screen scroll padded={false}>
      <View style={[styles.hero, { backgroundColor: palette.surface }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 12 }} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={initialsName} uri={pro.photoURL} size={76} online={pro.online} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: palette.text, fontSize: 21, fontWeight: '800' }}>{pro.businessName || pro.displayName}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13.5, marginTop: 2 }}>
              {pro.displayName} · {pro.yearsExperience} yrs experience
            </Text>
            <View style={{ marginTop: 6 }}>
              <Rating value={pro.rating} count={pro.reviewCount} size={13.5} />
            </View>
          </View>
          <Pressable
            onPress={async () => setFav(await toggleFavorite(user?.uid ?? '', pro.uid))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save professional"
          >
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={26} color="#fff" />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 }}>
          {pro.verified ? <Badge label="✓ Verified" tone="success" /> : null}
          {pro.badges.map((b) => (
            <Badge key={b} label={b} tone="info" />
          ))}
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {/* actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Message" variant="secondary" onPress={startChat} style={{ flex: 1 }} icon="chatbubble-outline" />
          <Button
            label={`Request quote`}
            onPress={() => navigation.navigate('RequestWizard', { serviceId: pro.serviceIds[0] })}
            style={{ flex: 1 }}
            icon="pricetag-outline"
          />
        </View>

        {/* stats */}
        <View style={[styles.statsRow, { borderColor: palette.border }]}>
          {[
            ['Jobs done', String(pro.jobsCompleted)],
            ['Replies', `${pro.responseRatePct}%`],
            ['Avg reply', `${pro.medianResponseMinutes}m`],
            ['From', `${money(pro.startingPrice, { compact: true })}`],
          ].map(([k, v], i) => (
            <View key={k} style={[styles.stat, i < 3 ? { borderRightWidth: 1, borderRightColor: palette.border } : null]}>
              <Text style={{ color: palette.text, fontSize: 15.5, fontWeight: '800' }}>{v}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 11.5, marginTop: 2 }}>{k}</Text>
            </View>
          ))}
        </View>

        <SectionTitle palette={palette}>About</SectionTitle>
        <Text style={{ color: palette.text, fontSize: 14.5, lineHeight: 22 }}>{pro.about}</Text>

        <SectionTitle palette={palette}>Services & pricing</SectionTitle>
        {pro.services.map((s) => (
          <View key={s.id} style={[styles.serviceRow, { borderColor: palette.border }]}>
            <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '600', flex: 1 }}>{s.name}</Text>
            <Text style={{ color: palette.primary, fontSize: 14.5, fontWeight: '800' }}>
              {money(s.price)} <Text style={{ color: palette.textMuted, fontSize: 11.5, fontWeight: '500' }}>{PRICE_UNIT_LABEL[s.unit]}</Text>
            </Text>
          </View>
        ))}

        {pro.portfolio.length ? (
          <>
            <SectionTitle palette={palette}>Portfolio</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              {pro.portfolio.map((p) => (
                <View key={p.id} style={[styles.portCard, { borderRadius: radius.lg, borderColor: palette.border }]}>
                  <Image
                    source={{ uri: p.imageURL }}
                    style={styles.portImg}
                    onError={(e) => {
                      (e.target as unknown as { source?: { uri?: string } } | undefined) && undefined;
                    }}
                  />
                  <Text numberOfLines={1} style={{ color: palette.text, fontSize: 12.5, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 6 }}>
                    {p.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        <SectionTitle palette={palette}>Availability</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {WEEKDAYS.map((d, i) => {
            const on = pro.availability.workingHours[i]?.enabled;
            return (
              <View key={d} style={[styles.dayChip, { borderRadius: radius.full, backgroundColor: on ? palette.primary : palette.surfaceAlt }]}>
                <Text style={{ color: on ? palette.onPrimary : palette.textMuted, fontSize: 11.5, fontWeight: '700' }}>{d}</Text>
              </View>
            );
          })}
        </View>
        <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 8 }}>
          Serves {pro.serviceArea.join(' · ')}
        </Text>

        <SectionTitle palette={palette}>Reviews ({pro.reviewCount})</SectionTitle>
        {reviews.length ? (
          reviews.slice(0, 5).map((r) => (
            <Card key={r.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Avatar name={r.customerName} size={30} />
                <Text style={{ color: palette.text, fontSize: 14, fontWeight: '700', marginLeft: 8, flex: 1 }}>
                  {r.customerName}
                </Text>
                <Rating value={r.overall} size={12} />
              </View>
              {r.text ? (
                <Text style={{ color: palette.textMuted, fontSize: 13.5, lineHeight: 19 }}>{r.text}</Text>
              ) : null}
              <Text style={{ color: palette.textMuted, fontSize: 11, marginTop: 6 }}>{relativeTime(r.createdAt)}</Text>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={{ color: palette.textMuted, fontSize: 13.5, lineHeight: 19 }}>
              {pro.reviewCount > 0
                ? `${pro.reviewCount} customers rated ${pro.businessName || pro.displayName} ${pro.rating}★ on average.`
                : 'New on Betegna — be one of the first to book and review.'}
            </Text>
          </Card>
        )}
        <View style={{ height: 20 }} />
      </View>
    </Screen>
  );
}

function SectionTitle({ children, palette }: { children: React.ReactNode; palette: ReturnType<typeof useTheme>['palette'] }) {
  return (
    <Text style={{ color: palette.text, fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 10 }}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth * 1.5 },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, paddingVertical: 12, marginTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 10 },
  portCard: { width: 170, borderWidth: 1, marginRight: 10, overflow: 'hidden' },
  portImg: { width: 170, height: 110 },
  dayChip: { width: 42, height: 30, alignItems: 'center', justifyContent: 'center' },
});
