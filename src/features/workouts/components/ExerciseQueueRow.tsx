import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import type { WorkoutExercise } from '../domain/types';
export function ExerciseQueueRow({
  group,
  onSelect,
}: {
  group: WorkoutExercise;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const completed = group.sets.filter(set => set.completedAt !== null).length;
  const done = group.sets.length > 0 && completed === group.sets.length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${group.exercise.name}`}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceHighest }]}>
        <Icon name={done ? 'checkCircle' : 'dumbbell'} color={colors.primary} />
      </View>
      <View style={styles.name}>
        <Text variant="headlineSm">{group.exercise.name}</Text>
        <Text tone="muted">
          {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'} •{' '}
          {completed} logged • {group.exercise.primaryMuscleGroup}
        </Text>
      </View>
      <Icon name="chevronDown" color={colors.subtle} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
  },
  icon: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, gap: spacing.xs },
  pressed: { opacity: opacity.pressed },
});
