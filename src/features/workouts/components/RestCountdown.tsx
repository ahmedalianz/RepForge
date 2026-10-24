import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, sizes, spacing } from '../../../app/theme/tokens';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { IconButton } from '../../../shared/components/IconButton';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import type { WorkoutRuntime } from '../domain/types';
import { getRestState } from '../domain/time';
import { useWorkoutClock } from '../hooks/useWorkoutClock';
export function RestCountdown({
  runtime,
  onExtend,
  onSkip,
}: {
  runtime: WorkoutRuntime;
  onExtend: () => void;
  onSkip: () => void;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const { colors } = useTheme();
  const now = useWorkoutClock();
  const rest = getRestState(runtime.restEndsAt, runtime.restDurationMs, now);
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceHigh,
            borderColor: colors.primaryMuted,
          },
        ]}
      >
        <View style={styles.row}>
          {width >= 360 ? (
            <View
              style={[
                styles.timerIcon,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primaryMuted,
                },
              ]}
            >
              <Icon name="timer" color={colors.primary} />
            </View>
          ) : null}
          <View style={styles.readout}>
            <View style={styles.status}>
              <Text variant="labelSm" tone="muted">
                REST COUNTDOWN
              </Text>
              <Text
                variant="labelSm"
                style={[
                  styles.badge,
                  {
                    color: colors.primary,
                    backgroundColor: colors.primaryMuted,
                  },
                ]}
              >
                {rest.active ? 'ACTIVE' : 'READY'}
              </Text>
            </View>
            <View style={styles.baseline}>
              <Text
                variant="metricMd"
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLabel={`Rest remaining ${rest.label}`}
              >
                {rest.label}
              </Text>
              <Text variant="labelMd" tone="muted">
                left
              </Text>
            </View>
          </View>
          <Button
            title="+30s"
            leadingIcon={compact ? undefined : 'timer'}
            variant="secondary"
            size="compact"
            onPress={onExtend}
          />
          <IconButton
            icon="skip"
            label="Skip rest"
            disabled={!rest.active}
            onPress={onSkip}
          />
        </View>
        <View
          style={[styles.track, { backgroundColor: colors.surfaceLowest }]}
          accessibilityRole="progressbar"
          accessibilityLabel="Rest remaining"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(rest.progress * 100),
          }}
        >
          <View
            style={[
              styles.progress,
              {
                backgroundColor: colors.primary,
                width: `${rest.progress * 100}%`,
              },
            ]}
          />
        </View>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  card: { padding: spacing.md, gap: spacing.sm, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timerIcon: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readout: { flex: 1, minWidth: 0 },
  status: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  badge: { paddingHorizontal: spacing.xs, borderRadius: radii.sm },
  track: { height: spacing.sm, borderRadius: radii.full, overflow: 'hidden' },
  progress: { height: '100%', borderRadius: radii.full },
});
