import { useTranslation } from 'react-i18next';
import {
  getExerciseName,
  getMuscleName,
  getExerciseCategoryName,
} from '../../../localization/exercises';
import { unitLabel } from '../../../localization/format';
import { t } from '../../../localization/i18n';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, sizes, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { IconButton } from '../../../shared/components/IconButton';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { getPreviousPerformance } from '../domain/presentation';
import type { WorkoutExercise } from '../domain/types';
import type { WeightUnit } from '../domain/strength';
import { setLayout as columns } from './setLayout';
export function ExercisePanelHeader({
  group,
  unit,
  compact,
  editable,
  onOptions,
}: {
  group: WorkoutExercise;
  unit: WeightUnit;
  compact: boolean;
  editable: boolean;
  onOptions: () => void;
}) {
  useTranslation();
  const { colors } = useTheme();
  const { exercise } = group;
  const muscles = [
    exercise.primaryMuscleGroup,
    ...exercise.secondaryMuscleGroups,
  ]
    .map(getMuscleName)
    .join(' • ');
  const previous = getPreviousPerformance(group, unit);
  const loadHeading =
    exercise.exerciseType === 'bodyweight'
      ? t('workouts:bodyweight')
      : exercise.exerciseType === 'assisted'
        ? t('workouts:assistance')
        : unitLabel(unit);
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.title}>
          <View style={styles.classification}>
            <Text
              variant="labelSm"
              style={[
                styles.category,
                {
                  color: colors.primary,
                  backgroundColor: colors.surfaceHighest,
                },
              ]}
            >
              {getExerciseCategoryName(exercise.category)}
            </Text>
            <Text variant="labelSm" tone="muted" style={styles.muscles}>
              {muscles}
            </Text>
          </View>
          <Text variant="headlineMd">
            {getExerciseName(exercise.id, exercise.name)}
          </Text>
        </View>
        {editable ? (
          <IconButton
            icon="more"
            label={t('workouts:exerciseOptions')}
            onPress={onOptions}
          />
        ) : null}
      </View>
      <Text variant="captionSm" tone="muted">
        {t('workouts:rpeHelp')}
      </Text>
      <View style={[styles.best, { backgroundColor: colors.surfaceLow }]}>
        <Icon name="trophy" color={colors.milestone} size={sizes.smallIcon} />
        <Text variant="labelMd" tone="muted">
          {previous.label}
        </Text>
        <Text
          variant="bodyBold"
          style={[
            styles.bestValue,
            { color: previous.record ? colors.milestone : colors.muted },
          ]}
        >
          {previous.value}
        </Text>
      </View>
      <View style={[columns.row, styles.labels]}>
        <Text
          variant="labelSm"
          tone="muted"
          style={[columns.index, styles.center]}
        >
          {t('workouts:set')}
        </Text>
        {!compact ? (
          <Text variant="labelSm" tone="muted" style={columns.previous}>
            {t('workouts:previous')}
          </Text>
        ) : null}
        <Text variant="labelSm" tone="muted" style={columns.numeric}>
          {loadHeading}
        </Text>
        <Text variant="labelSm" tone="muted" style={columns.numeric}>
          {t('workouts:reps')}
        </Text>
        <Text variant="labelSm" tone="muted" style={columns.numeric}>
          {t('workouts:rpe')}
        </Text>
        <Text
          variant="labelSm"
          tone="muted"
          style={columns.complete}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {t('workouts:complete')}
        </Text>
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, gap: spacing.xs },
  classification: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  category: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
    borderRadius: radii.sm,
  },
  muscles: { flexShrink: 1 },
  best: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  bestValue: { writingDirection: 'ltr', flexShrink: 1 },
  labels: { paddingHorizontal: spacing.sm },
  center: { textAlign: 'center' },
});
