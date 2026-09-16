import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../../../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'accent';
};

export function LabButton({
  label,
  onPress,
  disabled,
  tone = 'default',
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        tone === 'accent' && styles.accent,
        tone === 'danger' && styles.danger,
        (pressed || disabled) && styles.pressed,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export function ButtonRow({children}: {children: React.ReactNode}) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  accent: {
    borderColor: colors.accent,
  },
  danger: {
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
});
