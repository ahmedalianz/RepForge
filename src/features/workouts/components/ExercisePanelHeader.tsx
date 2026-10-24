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
  const { colors } = useTheme();
  const { exercise } = group;
  const muscles = [
    exercise.primaryMuscleGroup,
    ...exercise.secondaryMuscleGroups,
  ].join(' • ');
  const previous = getPreviousPerformance(group, unit);
  const loadHeading =
    exercise.exerciseType === 'bodyweight'
      ? 'BW'
      : exercise.exerciseType === 'assisted'
        ? 'ASSIST'
        : unit.toUpperCase();
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
              {exercise.category.toUpperCase()}
            </Text>
            <Text variant="labelSm" tone="muted" style={styles.muscles}>
              {muscles.toUpperCase()}
            </Text>
          </View>
          <Text variant="headlineMd">{exercise.name}</Text>
        </View>
        {editable ? (
          <IconButton
            icon="more"
            label="Exercise options"
            onPress={onOptions}
          />
        ) : null}
      </View>
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
          SET
        </Text>
        {!compact ? (
          <Text variant="labelSm" tone="muted" style={columns.previous}>
            PREVIOUS
          </Text>
        ) : null}
        <Text variant="labelSm" tone="muted" style={columns.numeric}>
          {loadHeading}
        </Text>
        <Text variant="labelSm" tone="muted" style={columns.numeric}>
          REPS
        </Text>
        <Text variant="labelSm" tone="muted" style={columns.numeric}>
          RPE
        </Text>
        <Text
          variant="labelSm"
          tone="muted"
          style={columns.complete}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          COMPLETE
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
  bestValue: { flexShrink: 1 },
  labels: { paddingHorizontal: spacing.sm },
  center: { textAlign: 'center' },
});
