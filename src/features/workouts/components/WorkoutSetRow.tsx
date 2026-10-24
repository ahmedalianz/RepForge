import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import {
  opacity,
  radii,
  sizes,
  spacing,
  typography,
} from '../../../app/theme/tokens';
import { IconButton } from '../../../shared/components/IconButton';
import { Text } from '../../../shared/components/Text';
import { formatLoad } from '../domain/weightPresentation';
import { formatSetPerformance } from '../domain/presentation';
import type { WorkoutSet } from '../domain/types';
import type { WeightUnit } from '../domain/strength';
import type { SetInput, SetInputField } from '../domain/setInput';
import { PlateStepper } from './PlateStepper';
import { setLayout as columns } from './setLayout';
type Props = {
  set: WorkoutSet;
  index: number;
  previous?: WorkoutSet;
  active: boolean;
  editable: boolean;
  compact: boolean;
  unit: WeightUnit;
  input: SetInput;
  onChange: (field: SetInputField, value: string) => void;
  onComplete: (set: WorkoutSet) => void;
  onSelect: (set: WorkoutSet) => void;
  onStep: (delta: number) => void;
};
function NumericInput({
  field,
  value,
  unit,
  setIndex,
  onChange,
}: {
  field: SetInputField;
  value: string;
  unit: string;
  setIndex: number;
  onChange: Props['onChange'];
}) {
  const { colors } = useTheme();
  const labels = { weight: 'Load', reps: 'Reps', rpe: 'RPE' };
  const label = field === 'weight' ? unit : field;
  return (
    <View
      style={[
        columns.numeric,
        styles.inputShell,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: field === 'rpe' ? colors.border : colors.primary,
        },
      ]}
    >
      <TextInput
        selectTextOnFocus
        value={value}
        onChangeText={text => onChange(field, text)}
        accessibilityLabel={`${labels[field]} for set ${setIndex}${field === 'weight' ? ` in ${unit}` : ''}`}
        keyboardType={field === 'reps' ? 'number-pad' : 'decimal-pad'}
        placeholder={field === 'rpe' ? '—' : '0'}
        placeholderTextColor={colors.subtle}
        style={[
          styles.input,
          { color: field === 'rpe' ? colors.milestone : colors.primary },
        ]}
        maxLength={12}
      />
      <Text
        pointerEvents="none"
        variant="labelSm"
        tone="muted"
        style={styles.inputUnit}
      >
        {label}
      </Text>
    </View>
  );
}
export function WorkoutSetRow({
  set,
  index,
  previous,
  active,
  editable,
  compact,
  unit,
  input,
  onChange,
  onComplete,
  onSelect,
  onStep,
}: Props) {
  const { colors } = useTheme();
  const completed = set.completedAt !== null;
  const ordinal = index + 1;
  const previousLabel = previous ? formatSetPerformance(previous, unit) : '—';
  const loadLabel =
    set.weightKg === null ? 'BW' : formatLoad(set.weightKg, unit);
  const kind = set.kind === 'warmup' ? 'Warm' : 'Work';
  const actionLabel = completed
    ? `Mark set ${ordinal} incomplete`
    : active
      ? `Complete set ${ordinal}`
      : `Edit set ${ordinal}`;
  return (
    <View style={[styles.panel, { backgroundColor: colors.surface }]}>
      <Pressable
        accessible={false}
        disabled={!editable || active || completed}
        onPress={() => onSelect(set)}
        style={[
          styles.set,
          {
            backgroundColor: active ? colors.surfaceHigh : colors.surfaceLow,
            borderColor: active ? colors.primary : colors.surfaceLow,
          },
          active && styles.active,
          !active && completed && styles.completed,
        ]}
      >
        {compact && active ? (
          <Text variant="labelSm" tone="muted">
            Previous: {previousLabel}
          </Text>
        ) : null}
        <View style={columns.row}>
          <View style={columns.index}>
            <Text
              variant={active ? 'headlineSm' : 'bodyBold'}
              style={{ color: active ? colors.primary : colors.subtle }}
            >
              {ordinal}
            </Text>
            <Text
              variant="labelSm"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: active ? colors.primary : colors.subtle }}
            >
              {active ? 'ACTIVE' : kind}
            </Text>
          </View>
          {!compact ? (
            <Text variant="labelMd" tone="muted" style={columns.previous}>
              {previousLabel}
            </Text>
          ) : null}
          {active && set.loadType !== 'bodyweight' ? (
            <NumericInput
              field="weight"
              value={input.weight}
              unit={unit}
              setIndex={ordinal}
              onChange={onChange}
            />
          ) : (
            <Text variant="bodyBold" tone="muted" style={columns.numeric}>
              {loadLabel}
            </Text>
          )}
          {active ? (
            <NumericInput
              field="reps"
              value={input.reps}
              unit={unit}
              setIndex={ordinal}
              onChange={onChange}
            />
          ) : (
            <Text variant="bodyBold" tone="muted" style={columns.numeric}>
              {set.reps || '—'}
            </Text>
          )}
          {active ? (
            <NumericInput
              field="rpe"
              value={input.rpe}
              unit={unit}
              setIndex={ordinal}
              onChange={onChange}
            />
          ) : (
            <Text variant="labelMd" tone="muted" style={columns.numeric}>
              {set.rpe === null ? '—' : set.rpe.toFixed(1)}
            </Text>
          )}
          <IconButton
            icon={completed || active ? 'check' : 'circle'}
            label={actionLabel}
            accessibilityRole={completed || active ? 'checkbox' : 'button'}
            accessibilityState={{ checked: completed }}
            disabled={!editable}
            variant={active ? 'primary' : completed ? 'selected' : 'neutral'}
            onPress={() => onComplete(set)}
          />
        </View>
        {active && set.loadType !== 'bodyweight' ? (
          <PlateStepper unit={unit} compact={compact} onStep={onStep} />
        ) : null}
        {active && set.loadType === 'assisted' ? (
          <Text variant="labelSm" tone="muted">
            LOAD IS ASSISTANCE, NOT EXTERNAL WEIGHT
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  set: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.control,
    gap: spacing.sm,
  },
  active: { borderWidth: 2 },
  completed: { opacity: opacity.completed },
  inputShell: {
    height: sizes.touchTarget,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  input: {
    ...typography.headlineSm,
    fontVariant: ['tabular-nums'],
    padding: 0,
    paddingBottom: spacing.md,
    height: sizes.touchTarget,
    textAlign: 'center',
  },
  inputUnit: {
    position: 'absolute',
    bottom: spacing.micro,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});
