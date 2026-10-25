import { formatNumber } from '../../../localization/format';
import { getExerciseName } from '../../../localization/exercises';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Text } from '../../../shared/components/Text';
import { Icon } from '../../../shared/components/Icon';
import { formatDuration } from '../../../shared/utils/formatDuration';
import { formatSetPerformance } from '../../workouts/domain/presentation';
import type { ProgressViewModel } from '../hooks/useProgress';
export function TrainingSummary({ vm }: { vm: ProgressViewModel }) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  const summary = vm.summary!;
  const latest = summary.latestSet;
  const rows = [
    [
      t('selectedExercise'),
      vm.exercise
        ? getExerciseName(vm.exercise.id, vm.exercise.name)
        : t('chooseExercise'),
    ],
    [
      t('lastSet'),
      latest ? formatSetPerformance(latest, vm.unit, true) : t('noSets'),
    ],
    [t('trainingDays'), formatNumber(summary.trainingDays)],
    [t('sessionTime'), formatDuration(summary.durationMs)],
  ];
  return (
    <Card>
      <View style={styles.heading}>
        <Icon name="checkCircle" color={colors.primary} />
        <Text variant="headlineSm" style={styles.title}>
          {t('summaryTitle')}
        </Text>
      </View>
      <View style={[styles.inset, { backgroundColor: colors.surfaceHigh }]}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text variant="labelSm" tone="muted" style={styles.label}>
              {label}
            </Text>
            <Text variant="labelSm" style={styles.value}>
              {value}
            </Text>
          </View>
        ))}
      </View>
      <Text tone="muted">
        {t('summaryDescription', {
          sets: formatNumber(summary.workingSets),
          workouts: formatNumber(summary.workouts),
        })}
      </Text>
      <Text variant="captionSm" tone="muted">
        {t('summaryNote')}
      </Text>
    </Card>
  );
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  inset: { borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { flex: 1 },
  value: { flex: 1 },
});
