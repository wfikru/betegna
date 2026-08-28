import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../state/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, multiline, ...rest }: Props) {
  const { palette, radius } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: palette.text }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={palette.textMuted}
        multiline={multiline}
        {...rest}
        style={[
          styles.input,
          {
            borderRadius: radius.md,
            backgroundColor: palette.surface,
            borderColor: error ? palette.danger : palette.border,
            color: palette.text,
          },
          multiline ? { minHeight: 90, textAlignVertical: 'top' } : null,
        ]}
      />
      {error ? (
        <Text style={[styles.meta, { color: palette.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.meta, { color: palette.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5 },
  meta: { fontSize: 12.5, marginTop: 5 },
});
