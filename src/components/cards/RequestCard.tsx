import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useTheme } from '../../state/ThemeContext';
import type { ServiceRequest } from '../../models/types';
import { REQUEST_STATUS, URGENCY_LABEL } from '../../constants/status';
import { relativeTime, truncate } from '../../utils/format';

export function RequestCard({ request, onPress }: { request: ServiceRequest; onPress: () => void }) {
  const { palette } = useTheme();
  const status = REQUEST_STATUS[request.status];
  return (
    <Card onPress={onPress}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15.5, fontWeight: '700' }}>
            {request.serviceName}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>
            {request.location.subcity} · {URGENCY_LABEL[request.when.urgency]} · {relativeTime(request.createdAt)}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <Text numberOfLines={2} style={{ color: palette.textMuted, fontSize: 13.5, marginTop: 8, lineHeight: 19 }}>
        {truncate(request.summaryText || request.serviceName, 110)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
});
