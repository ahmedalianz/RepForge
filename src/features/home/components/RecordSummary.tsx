import { formatNumber } from '../../../localization/format';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import type { DashboardPresentation } from '../domain/presentation';
import { dashboardStyles as layout } from './dashboardStyles';
export function RecordSummary({
  dashboard,
  onRecords,
}: {
  dashboard: DashboardPresentation;
  onRecords: () => void;
}) {
  const { t } = useTranslation('home');
  const { colors } = useTheme();
  const record = dashboard.record;
  const weight = record?.weight ?? '—';
  const repetitions = record ? formatNumber(record.reps) : '—';
  const comparison = dashboard.hasComparison
    ? t('priorMonth')
    : t('noBaseline');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('viewRecords')}
      onPress={onRecords}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card>
        <View style={[layout.between, layout.wrap]}>
          <View
            style={[
              layout.badge,
              styles.recordBadge,
              { backgroundColor: colors.milestone },
            ]}
          >
            <Icon
              name="trophy"
              color={colors.onMilestone}
              size={sizes.badgeIcon}
            />
            <Text
              variant="labelSm"
              style={[layout.uppercase, { color: colors.onMilestone }]}
            >
              {t('personalRecord')}
            </Text>
          </View>
          {record ? (
            <Text variant="labelSm" tone="muted">
              {record.date}
            </Text>
          ) : null}
        </View>
        <View style={styles.record}>
          <Text variant="headlineSm">
            {record?.exerciseName ?? t('firstRecord')}
          </Text>
          <View style={layout.metricRow}>
            <Text variant="metricMd">{weight}</Text>
            <Text variant="bodyBold" tone="muted">
              {t('recordPerformance', {
                unit: dashboard.unit,
                reps: repetitions,
              })}
            </Text>
            {record?.delta ? (
              <Text
                variant="labelMd"
                style={[
                  styles.delta,
                  {
                    color: colors.primary,
                    backgroundColor: colors.surfaceHigh,
                  },
                ]}
              >
                {t('delta', { value: record.delta })}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.metrics}>
          <View
            style={[layout.inset, { backgroundColor: colors.surfaceLowest }]}
          >
            <Text variant="labelSm" tone="muted">
              {t('estimatedMax')}
            </Text>
            <View style={[layout.metricRow, styles.estimateRow]}>
              <Text variant="headlineSm">{dashboard.estimate}</Text>
              <Text variant="labelSm" tone="muted">
                {dashboard.unit}
              </Text>
            </View>
          </View>
          <View
            style={[layout.inset, { backgroundColor: colors.surfaceLowest }]}
          >
            <Text variant="labelSm" tone="muted">
              {t('monthLoad')}
            </Text>
            <View style={[layout.row, styles.comparison]}>
              <Icon
                name="trend"
                size={sizes.badgeIcon}
                color={colors.primary}
              />
              <Text variant="bodyBold" style={{ color: colors.primary }}>
                {dashboard.loadChange}
              </Text>
              <Text variant="labelSm" tone="muted">
                {comparison}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  record: { gap: spacing.xs },
  estimateRow: { direction: 'inherit' },
  recordBadge: { borderRadius: radii.sm },
  metrics: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  comparison: { gap: spacing.xs, flexWrap: 'wrap' },
  delta: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.micro,
    marginStart: spacing.xs,
  },
  pressed: { opacity: opacity.pressed },
});
