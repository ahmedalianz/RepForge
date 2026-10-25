import { useTranslation } from 'react-i18next';
import { t } from '../../../localization/i18n';
import { formatNumber, unitLabel } from '../../../localization/format';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { PLATE_STEPS } from '../domain/setInput';
import type { WeightUnit } from '../domain/strength';
export function PlateStepper({
  unit,
  compact,
  onStep,
}: {
  unit: WeightUnit;
  compact: boolean;
  onStep: (delta: number) => void;
}) {
  useTranslation();
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceLowest },
        compact && styles.compact,
      ]}
    >
      <View style={styles.label}>
        <Icon name="tune" color={colors.primary} size={sizes.smallIcon} />
        <Text variant="labelSm" tone="muted">
          {t('workouts:plateStepper')}
        </Text>
      </View>
      <View style={styles.controls}>
        {PLATE_STEPS[unit].map((step, index) => (
          <Pressable
            key={step}
            accessibilityRole="button"
            accessibilityLabel={t(
              step > 0 ? 'workouts:increase' : 'workouts:decrease',
              { amount: formatNumber(Math.abs(step)), unit: unitLabel(unit) },
            )}
            onPress={() => onStep(step)}
            style={({ pressed }) => [
              styles.step,
              {
                backgroundColor: step > 0 ? colors.surfaceHigh : colors.surface,
                borderColor: step > 0 ? colors.primaryMuted : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              variant="bodyBold"
              style={[
                styles.numeric,
                { color: step > 0 ? colors.primary : colors.text },
              ]}
            >
              {step > 0 ? '+' : ''}
              {formatNumber(step)}
              {index === 3 ? ` ${unitLabel(unit)}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compact: { flexDirection: 'column', alignItems: 'stretch' },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  controls: {
    direction: 'ltr',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  step: {
    flex: 1,
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeric: { writingDirection: 'ltr' },
  pressed: { opacity: opacity.pressed },
});
