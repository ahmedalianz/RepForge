import { unitLabel } from '../../../localization/format';
import { getExerciseName } from '../../../localization/exercises';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Text } from '../../../shared/components/Text';
import { Icon } from '../../../shared/components/Icon';
import { PROGRESS_RANGES } from '../domain/types';
import type { ProgressViewModel } from '../hooks/useProgress';
function FilterChoices<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.choices}>
      {options.map(option => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [
            styles.choice,
            {
              backgroundColor:
                option.value === value
                  ? colors.primaryMuted
                  : colors.surfaceLow,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text
            variant="labelSm"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: option.value === value ? colors.primary : colors.muted,
            }}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function AnalyticsFilters({
  vm,
  onChoose,
}: {
  vm: ProgressViewModel;
  onChoose: () => void;
}) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  return (
    <View style={styles.filters}>
      <FilterChoices
        options={[
          { value: 'strength', label: t('strength') },
          { value: 'volume', label: t('volume') },
          { value: 'consistency', label: t('consistency') },
        ]}
        value={vm.view}
        onChange={vm.setView}
      />
      <View style={styles.context}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chooseExerciseAccessibility', {
            name: vm.exercise
              ? `: ${getExerciseName(vm.exercise.id, vm.exercise.name)}`
              : '',
          })}
          onPress={onChoose}
          style={({ pressed }) => [
            styles.exercise,
            { backgroundColor: colors.surface },
            pressed && styles.pressed,
          ]}
        >
          <Icon name="dumbbell" color={colors.primary} size={sizes.smallIcon} />
          <Text variant="bodyBold" numberOfLines={1} style={styles.name}>
            {vm.exercise
              ? getExerciseName(vm.exercise.id, vm.exercise.name)
              : t('chooseExercise')}
          </Text>
          <Icon
            name="chevronDown"
            color={colors.muted}
            size={sizes.smallIcon}
          />
        </Pressable>
        <View style={styles.units}>
          <FilterChoices
            options={[
              { value: 'kg', label: unitLabel('kg') },
              { value: 'lb', label: unitLabel('lb') },
            ]}
            value={vm.unit}
            onChange={vm.changeUnit}
          />
        </View>
      </View>
      <FilterChoices
        options={PROGRESS_RANGES.map(value => ({
          value,
          label: t(`range.${value}`),
        }))}
        value={vm.range}
        onChange={vm.setRange}
      />
      {vm.preferenceError ? (
        <Text tone="danger" accessibilityRole="alert">
          {vm.preferenceError}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  filters: { gap: spacing.sm },
  choices: { flexDirection: 'row', gap: spacing.xs },
  choice: {
    flex: 1,
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
  },
  context: { flexDirection: 'row', gap: spacing.sm },
  exercise: {
    flex: 1,
    minHeight: sizes.touchTarget,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  name: { flex: 1 },
  units: { width: sizes.touchTarget * 2 + spacing.xs },
  pressed: { opacity: opacity.pressed },
});
