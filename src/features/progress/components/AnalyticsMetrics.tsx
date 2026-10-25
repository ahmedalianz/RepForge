import {
  formatNumber,
  formatPercent,
  unitLabel,
  ltrText,
} from '../../../localization/format';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Icon, type IconName } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { formatLoad } from '../../workouts/domain/weightPresentation';
import type { ProgressRange } from '../domain/types';
import type { ProgressSummary } from '../domain/analytics';
import type { WeightUnit } from '../../workouts/domain/strength';
export function AnalyticsMetrics({
  summary,
  unit,
  range,
}: {
  summary: ProgressSummary;
  unit: WeightUnit;
  range: ProgressRange;
}) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  const metrics: {
    title: string;
    value: string;
    detail: string;
    icon: IconName;
    color: string;
  }[] = [
    {
      title: t('allTimeRecord'),
      value: summary.best
        ? ltrText(
            `${formatLoad(summary.best.weightKg!, unit)} ${unitLabel(unit)}`,
          )
        : '—',
      detail: summary.best
        ? t('repsEffort', {
            reps: formatNumber(summary.best.reps),
            effort:
              summary.best.rpe === null
                ? ''
                : t('rpe', { value: formatNumber(summary.best.rpe) }),
          })
        : t('noExternalLoad'),
      icon: 'trophy',
      color: colors.milestone,
    },
    {
      title: t('estimatedMax'),
      value:
        summary.estimatedMaxKg === null
          ? '—'
          : ltrText(
              `${formatLoad(summary.estimatedMaxKg, unit)} ${unitLabel(unit)}`,
            ),
      detail: t('epleyExercise'),
      icon: 'trend',
      color: colors.primary,
    },
    {
      title: t('periodVolume'),
      value: ltrText(
        `${formatLoad(summary.volumeKg, unit)} ${unitLabel(unit)}`,
      ),
      detail:
        summary.volumeChangePercent === null
          ? t('noBaseline')
          : t('previousPeriod', {
              change: formatPercent(summary.volumeChangePercent, 1, true),
            }),
      icon: 'chart',
      color: colors.secondary,
    },
    {
      title: t('workingSets'),
      value: formatNumber(summary.workingSets),
      detail: t('workoutRange', {
        count: summary.workouts,
        range: t(`range.${range}`),
      }),
      icon: 'checkCircle',
      color: colors.primary,
    },
  ];
  return (
    <View style={styles.grid}>
      {metrics.map(metric => (
        <Card
          key={metric.title}
          accessible
          accessibilityLabel={`${metric.title}: ${metric.value}. ${metric.detail}`}
          style={styles.card}
        >
          <View style={styles.heading}>
            <Text variant="labelSm" tone="muted" style={styles.title}>
              {metric.title.toUpperCase()}
            </Text>
            <Icon name={metric.icon} color={metric.color} />
          </View>
          <Text
            variant="headlineLgMobile"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {metric.value}
          </Text>
          <Text variant="labelSm" style={{ color: metric.color }}>
            {metric.detail}
          </Text>
        </Card>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { width: '47%', flexGrow: 1, minWidth: 0, gap: spacing.sm },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { flexShrink: 1 },
});
