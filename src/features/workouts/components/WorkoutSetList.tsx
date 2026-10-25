import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../localization/format';
import { t } from '../../../localization/i18n';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, spacing } from '../../../app/theme/tokens';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Text } from '../../../shared/components/Text';
import type { ActiveWorkoutViewModel } from '../hooks/useActiveWorkout';
import type { WorkoutExercise, WorkoutSet } from '../domain/types';
import { getSetInput } from '../domain/setInput';
import { COMPACT_SET_TABLE_WIDTH } from './setLayout';
import { WorkoutSetRow } from './WorkoutSetRow';
import { ExercisePanelHeader } from './ExercisePanelHeader';
import { ExerciseQueueRow } from './ExerciseQueueRow';
import { WorkoutFooter } from './WorkoutFooter';
type ListRow = { key: string } & (
  | { kind: 'set'; set: WorkoutSet; index: number }
  | { kind: 'actions' }
  | { kind: 'queue'; remaining: number }
  | { kind: 'exercise'; group: WorkoutExercise }
);
type Props = {
  vm: ActiveWorkoutViewModel;
  onAddExercise: () => void;
  onSetOptions: () => void;
  onExerciseOptions: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  onBack: () => void;
};
export function WorkoutSetList({
  vm,
  onAddExercise,
  onSetOptions,
  onExerciseOptions,
  onFinish,
  onDiscard,
  onBack,
}: Props) {
  useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_SET_TABLE_WIDTH;
  const others =
    vm.editor?.exercises.filter(
      group => group.exercise.id !== vm.selected?.exercise.id,
    ) ?? [];
  const remaining = others.filter(group =>
    group.sets.some(set => set.completedAt === null),
  ).length;
  const rows: ListRow[] = (vm.selected?.sets ?? []).map((set, index) => ({
    key: set.id,
    kind: 'set',
    set,
    index,
  }));
  if (vm.selected) {
    rows.push({ key: 'actions', kind: 'actions' });
  }
  if (others.length) {
    rows.push({ key: 'queue', kind: 'queue', remaining });
    for (const group of others) {
      rows.push({
        key: `exercise:${group.exercise.id}`,
        kind: 'exercise',
        group,
      });
    }
  }
  return (
    <FlatList
      data={rows}
      keyExtractor={row => row.key}
      style={styles.list}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      ListHeaderComponent={
        vm.selected ? (
          <ExercisePanelHeader
            group={vm.selected}
            unit={vm.unit}
            compact={compact}
            editable={vm.isActive}
            onOptions={onExerciseOptions}
          />
        ) : (
          <View style={styles.empty}>
            <EmptyState
              title={t('workouts:build')}
              message={t('workouts:buildMessage')}
            />
          </View>
        )
      }
      renderItem={({ item }) => {
        if (item.kind === 'set') {
          return (
            <WorkoutSetRow
              set={item.set}
              index={item.index}
              previous={vm.selected?.previousSets[item.index]}
              active={vm.isActive && item.set.id === vm.activeSet?.id}
              editable={vm.isActive}
              compact={compact}
              unit={vm.unit}
              input={
                item.set.id === vm.activeSet?.id
                  ? vm.draft.input
                  : getSetInput(item.set, vm.unit)
              }
              onChange={vm.draft.change}
              onComplete={vm.complete}
              onSelect={vm.selectSet}
              onStep={vm.draft.step}
            />
          );
        }
        if (item.kind === 'actions') {
          return (
            <View style={[styles.actions, { backgroundColor: colors.surface }]}>
              {vm.isActive ? (
                <>
                  <View style={styles.action}>
                    <Button
                      title={t('workouts:addSet')}
                      leadingIcon="add"
                      variant="secondary"
                      onPress={() => vm.addSet()}
                    />
                  </View>
                  <View style={styles.action}>
                    <Button
                      title={t('workouts:setOptions')}
                      leadingIcon="more"
                      variant="secondary"
                      disabled={!vm.activeSet}
                      onPress={onSetOptions}
                    />
                  </View>
                </>
              ) : (
                <Text tone="muted">
                  {t('workouts:status', {
                    status: t(
                      `workouts:status_${vm.session?.status ?? 'completed'}`,
                    ),
                  })}
                </Text>
              )}
            </View>
          );
        }
        if (item.kind === 'queue') {
          return (
            <View style={styles.queueTitle}>
              <Text variant="labelMd" tone="muted">
                {t('workouts:workoutExercises')}
              </Text>
              <Text
                variant="labelSm"
                style={[
                  styles.count,
                  { color: colors.muted, backgroundColor: colors.surfaceHigh },
                ]}
              >
                {t('workouts:remaining', {
                  count: formatNumber(item.remaining),
                })}
              </Text>
            </View>
          );
        }
        return (
          <ExerciseQueueRow
            group={item.group}
            onSelect={() => vm.selectExercise(item.group.exercise.id)}
          />
        );
      }}
      ListFooterComponent={
        <WorkoutFooter
          editable={vm.isActive}
          canFinish={vm.completedSets > 0}
          onAddExercise={onAddExercise}
          onFinish={onFinish}
          onDiscard={onDiscard}
          onBack={onBack}
        />
      }
    />
  );
}
const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingTop: spacing.xs },
  empty: { padding: spacing.lg },
  actions: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: { flex: 1 },
  queueTitle: {
    paddingHorizontal: spacing.marginMd,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  count: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
    borderRadius: radii.sm,
  },
});
