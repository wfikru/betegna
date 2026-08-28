import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/common/Avatar';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import type { AppointmentPayload, Conversation, Message } from '../../models/types';
import {
  getConversation,
  markConversationRead,
  sendMessage,
  subscribeConversations,
  subscribeMessages,
} from '../../services/chat';
import { acceptQuote } from '../../services/quotes';
import type { RootStackParamList } from '../../app/navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

export default function ChatThreadScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const nav = navigation;
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setConversation(getConversation(route.params.conversationId));
    return subscribeConversations(user?.uid ?? '', (list) => {
      const found = list.find((c) => c.id === route.params.conversationId);
      if (found) setConversation(found);
    });
  }, [route.params.conversationId, user]);

  useEffect(() => {
    const unsub = subscribeMessages(route.params.conversationId, (msgs) => {
      setMessages(msgs);
      if (user) void markConversationRead(route.params.conversationId, user.uid);
    });
    return unsub;
  }, [route.params.conversationId, user]);

  useEffect(() => {
    if (messages.length) scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [messages.length]);

  const otherId = conversation
    ? conversation.customerId === user?.uid
      ? conversation.proId
      : conversation.customerId
    : '';
  const otherName = conversation?.participantNames[otherId] ?? route.params.title ?? 'Chat';
  const typing = conversation?.typing?.[otherId] ?? false;

  const onAcceptAppointment = async (_p: AppointmentPayload) => {
    if (!user) return;
    await sendMessage(route.params.conversationId, user, { type: 'text', text: 'That time works for me ✓' });
    if (conversation?.quoteId) {
      try {
        const bookingId = await acceptQuote(conversation.quoteId, user.name);
        nav.navigate('BookingDetail', { bookingId });
      } catch {
        /* quote already accepted/declined elsewhere */
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: palette.surface, borderBottomColor: palette.border, paddingTop: Math.max(insets.top, 8) },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <View style={{ marginLeft: 8 }}>
          <Avatar name={otherName} uri={conversation?.participantPhotos?.[otherId]} size={36} online={typing} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>
            {otherName}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 11.5 }}>
            {typing ? 'typing…' : 'Protected by Betegna'}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        <View style={{ height: 12 }} />
        <View style={[styles.privacy, { backgroundColor: palette.surfaceAlt }]}>
          <Text style={{ color: palette.textMuted, fontSize: 11.5, textAlign: 'center', lineHeight: 16 }}>
            🔒 For your safety, keep conversations and payments inside Betegna.
          </Text>
        </View>
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            mine={m.senderId === user?.uid}
            onAcceptAppointment={onAcceptAppointment}
          />
        ))}
        {typing ? <TypingIndicator name={otherName.split(' ')[0] ?? ''} /> : null}
        <View style={{ height: 14 }} />
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 6) }}>
        <ChatInput
          onSend={(text) => {
            if (user) void sendMessage(route.params.conversationId, user, { type: 'text', text });
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1 },
  messages: { paddingHorizontal: 12 },
  privacy: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginBottom: 10, maxWidth: '92%' },
});
