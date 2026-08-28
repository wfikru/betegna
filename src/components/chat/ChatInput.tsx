import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';

export function ChatInput({
  onSend,
  onAttach,
  disabled,
}: {
  onSend: (text: string) => void;
  onAttach?: () => void;
  disabled?: boolean;
}) {
  const { palette, radius } = useTheme();
  const [text, setText] = useState('');
  return (
    <View style={[styles.wrap, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
      {onAttach ? (
        <Pressable onPress={onAttach} style={styles.attach} hitSlop={10} accessibilityRole="button" accessibilityLabel="Attach photo">
          <Ionicons name="add-circle-outline" size={26} color={palette.primary} />
        </Pressable>
      ) : null}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a message…"
        placeholderTextColor={palette.textMuted}
        editable={!disabled}
        multiline
        style={[styles.input, { backgroundColor: palette.surfaceAlt, color: palette.text, borderRadius: radius.full }]}
      />
      <Pressable
        onPress={() => {
          const t = text.trim();
          if (!t) return;
          setText('');
          onSend(t);
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.send,
          { backgroundColor: text.trim() ? palette.primary : palette.border, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Ionicons name="arrow-up" size={20} color={palette.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1 },
  attach: { padding: 8 },
  input: { flex: 1, maxHeight: 110, minHeight: 42, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
