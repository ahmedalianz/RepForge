import {
  formatNumber,
  formatDate,
  unitLabel,
  ltrText,
} from '../../../localization/format';
import { getExerciseName } from '../../../localization/exercises';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { formatLoad } from '../../workouts/domain/weightPresentation';
import type { WeightUnit } from '../../workouts/domain/strength';
import type { LoadRecord } from '../domain/types';
export function RecordRow({
  record,
  unit,
  onOpen,
}: {
  record: LoadRecord;
  unit: WeightUnit;
  onOpen: (sessionId: string) => void;
}) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  const date = formatDate(record.completedAt, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('openRecord', {
        exercise: getExerciseName(record.exerciseId, record.exerciseName),
        date,
        weight: formatLoad(record.weightKg, unit),
        unit: unitLabel(unit),
        reps: formatNumber(record.reps),
      })}
      onPress={() => onOpen(record.sessionId)}
      style={({ pressed }) => [
        styles.record,
        { backgroundColor: colors.surfaceHigh },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.medal, { backgroundColor: colors.milestoneMuted }]}>
        <Icon name="trophy" color={colors.milestone} size={sizes.smallIcon} />
      </View>
      <View style={styles.name}>
        <Text variant="bodyBold">
          {getExerciseName(record.exerciseId, record.exerciseName)}
        </Text>
        <Text variant="labelSm" tone="muted">
          {date}
        </Text>
        <Text variant="labelSm" style={{ color: colors.milestone }}>
          {record.previousWeightKg === null ? t('firstLoad') : t('newRecord')}
        </Text>
      </View>
      <View style={styles.value}>
        <Text variant="headlineSm">
          {ltrText(`${formatLoad(record.weightKg, unit)} ${unitLabel(unit)}`)}
        </Text>
        <Text variant="labelSm" tone="muted">
          {t('repetitions', { count: record.reps })}
        </Text>
      </View>
    </Pressable>
  );
}
export function RecordHistory({
  records,
  unit,
  onHistory,
  onOpen,
}: {
  records: LoadRecord[];
  unit: WeightUnit;
  onHistory: () => void;
  onOpen: (sessionId: string) => void;
}) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.heading}>
        <Icon name="trophy" color={colors.milestone} size={sizes.smallIcon} />
        <Text variant="headlineSm" style={styles.name}>
          {t('recordedHistory')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('personalRecords')}
          onPress={onHistory}
          style={styles.history}
        >
          <Text variant="labelSm" style={{ color: colors.primary }}>
            {t('history')}
          </Text>
        </Pressable>
      </View>
      {records.slice(0, 3).map(record => (
        <RecordRow
          key={record.setId}
          record={record}
          unit={unit}
          onOpen={onOpen}
        />
      ))}
      {!records.length ? <Text tone="muted">{t('historyEmpty')}</Text> : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  history: {
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    minHeight: sizes.touchTarget,
  },
  medal: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, gap: spacing.xs },
  value: { alignItems: 'flex-end', flexShrink: 1 },
  pressed: { opacity: opacity.pressed },
});
