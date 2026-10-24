import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { spacing } from '../../../app/theme/tokens';
import { Button } from '../../../shared/components/Button';
export function WorkoutFooter({
  editable,
  canFinish,
  onAddExercise,
  onFinish,
  onDiscard,
  onBack,
}: {
  editable: boolean;
  canFinish: boolean;
  onAddExercise: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  if (!editable) {
    return (
      <View style={styles.wrapper}>
        <Button title="Back to Home" onPress={onBack} />
      </View>
    );
  }
  return (
    <View style={styles.wrapper}>
      <Button
        title="Add Exercise"
        leadingIcon="addCircle"
        variant="secondary"
        onPress={onAddExercise}
      />
      <View
        style={[
          styles.actions,
          { borderTopColor: colors.border },
          width < 360 && styles.stacked,
        ]}
      >
        <View style={styles.discard}>
          <Button
            title="Discard"
            leadingIcon="trash"
            size="compact"
            variant="destructive"
            onPress={onDiscard}
          />
        </View>
        <View style={styles.finish}>
          <Button
            title="Save & Finish Workout"
            leadingIcon="checkCircle"
            size="compact"
            disabled={!canFinish}
            labelStyle={styles.sentenceCase}
            onPress={onFinish}
          />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { padding: spacing.lg, gap: spacing.xl },
  actions: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  stacked: { flexDirection: 'column' },
  discard: { flex: 1 },
  finish: { flex: 2 },
  sentenceCase: { textTransform: 'none' },
});
