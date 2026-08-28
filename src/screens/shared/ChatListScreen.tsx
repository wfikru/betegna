import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { Avatar } from '../../components/common/Avatar';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Conversation } from '../../models/types';
import { subscribeConversations } from '../../services/chat';
import { relativeTime, truncate } from '../../utils/format';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';

export default function ChatListScreen() {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const a = subscribeConversations(user.uid, setConversations);
    return () => {
      a();
    };
  }, [user]);

  return (
    <Screen scroll style={{ paddingBottom: 110 }}>
      <View style={styles.topRow}>
        <View>
          <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800' }}>{t('chat.title')}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13.5, marginTop: 2 }}>
            Quotes, times and confirmations — all in one thread.
          </Text>
        </View>
        <View style={{ width: 46 }} />
      </View>

      {conversations === null ? (
        <SkeletonList rows={3} height={70} />
      ) : conversations.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title={t('chat.empty')} message={t('chat.emptyHint')} />
      ) : (
        conversations.map((c) => {
          const otherId = c.customerId === user?.uid ? c.proId : c.customerId;
          const otherName = c.participantNames[otherId] ?? 'Conversation';
          const otherPhoto = c.participantPhotos?.[otherId];
          const unread = c.unread[user?.uid ?? ''] ?? 0;
          return (
            <Pressable
              key={c.id}
              onPress={() => navigation.navigate('ChatThread', { conversationId: c.id })}
              style={({ pressed }) => [
                styles.row,
                { borderRadius: radius.lg, backgroundColor: pressed ? palette.surfaceAlt : palette.surface },
              ]}
            >
              <Avatar name={otherName} uri={otherPhoto} size={50} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15.5, fontWeight: '700', flex: 1 }}>
                    {otherName}
                  </Text>
                  {c.lastMessage ? (
                    <Text style={{ color: palette.textMuted, fontSize: 11.5 }}>{relativeTime(c.lastMessage.at)}</Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: unread ? palette.text : palette.textMuted, fontSize: 13.5, flex: 1, fontWeight: unread ? '600' : '400' }}
                  >
                    {c.typing?.[otherId] ? 'typing…' : truncate(c.lastMessage?.text ?? 'Say hello 👋', 46)}
                  </Text>
                  {unread ? (
                    <View style={[styles.badge, { backgroundColor: palette.primary }]}>
                      <Text style={{ color: palette.onPrimary, fontSize: 10, fontWeight: '800' }}>{unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8 },
  badge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginLeft: 8 },
});
