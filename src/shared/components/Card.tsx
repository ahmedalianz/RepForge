import type { PropsWithChildren } from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../app/theme/ThemeProvider';
import { radii, spacing } from '../../app/theme/tokens';
import { Text } from './Text';
/** Composition keeps feature content independent from its surface styling. */
export function Card({
  title,
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps & { title?: string }>) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[styles.card, { backgroundColor: colors.surface }, style]}
    >
      {title ? <Text variant="heading">{title}</Text> : null}
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
