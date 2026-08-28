import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';
import type { TimelineEvent } from '../../models/types';
import { relativeTime } from '../../utils/format';

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const { palette } = useTheme();
  return (
    <View>
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <View key={`${e.at}-${e.kind}`} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: last ? palette.primary : palette.success, borderColor: palette.surface }]} />
              {!last ? <View style={[styles.line, { backgroundColor: palette.border }]} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={{ color: last ? palette.text : palette.textMuted, fontSize: 14, fontWeight: last ? '700' : '500' }}>
                {e.label}
              </Text>
              <Text style={{ color: palette.textMuted, fontSize: 11.5, marginTop: 2 }}>
                {relativeTime(e.at)}
                {e.by ? ` · ${e.by}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: 20, marginRight: 10 },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  line: { flex: 1, width: 2, marginTop: 2 },
  content: { flex: 1, paddingBottom: 16 },
});
