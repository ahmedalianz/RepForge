import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../localization/format';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { sizes, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Icon, type IconName } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import type { DashboardPresentation } from '../domain/presentation';
export function QuickStats({
  dashboard,
}: {
  dashboard: DashboardPresentation;
}) {
  const { t } = useTranslation('home');
  const { colors } = useTheme();
  const metrics: {
    label: string;
    value: string;
    icon: IconName;
    color: string;
    accessibilityLabel: string;
  }[] = [
    {
      label: t('weeklyVolume', { unit: dashboard.unit }),
      value: dashboard.compactVolume,
      icon: 'dumbbell',
      color: colors.secondary,
      accessibilityLabel: t('volumeAccessibility', {
        volume: dashboard.weeklyVolume,
        unit: dashboard.unit,
      }),
    },
    {
      label: t('totalWorkouts'),
      value: formatNumber(dashboard.totalWorkouts),
      icon: 'checkCircle',
      color: colors.primary,
      accessibilityLabel: t('totalAccessibility', {
        count: dashboard.totalWorkouts,
      }),
    },
    {
      label: t('activeTime'),
      value: dashboard.activeTime,
      icon: 'timer',
      color: colors.milestone,
      accessibilityLabel: t('timeAccessibility', {
        time: dashboard.activeTime,
      }),
    },
  ];
  return (
    <View style={styles.grid}>
      {metrics.map(metric => (
        <Card
          key={metric.label}
          accessible
          accessibilityLabel={metric.accessibilityLabel}
          style={styles.metric}
        >
          <Icon
            name={metric.icon}
            color={metric.color}
            size={sizes.smallIcon}
          />
          <Text variant="metricSm" numberOfLines={1} adjustsFontSizeToFit>
            {metric.value}
          </Text>
          <Text variant="captionSm" tone="muted" style={styles.label}>
            {metric.label}
          </Text>
        </Card>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.md },
  metric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    minWidth: 0,
  },
  label: { textAlign: 'center', textTransform: 'uppercase' },
});
