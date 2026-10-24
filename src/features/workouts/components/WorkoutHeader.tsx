import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, sizes, spacing } from '../../../app/theme/tokens';
import { Button } from '../../../shared/components/Button';
import { IconButton } from '../../../shared/components/IconButton';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { useWorkoutClock } from '../hooks/useWorkoutClock';
import { formatWorkoutClock } from '../domain/time';
import type { WorkoutSession } from '../domain/types';
function ElapsedClock({
  session,
  compact,
}: {
  session: WorkoutSession;
  compact: boolean;
}) {
  const now = useWorkoutClock();
  const { colors } = useTheme();
  const label = formatWorkoutClock(
    (session.completedAt ?? now) - session.startedAt,
  );
  return (
    <View
      style={[
        styles.clock,
        { backgroundColor: colors.surface },
        compact && styles.compactClock,
      ]}
      accessible
      accessibilityLabel={`Workout duration ${label}`}
    >
      {!compact ? (
        <Icon name="timer" color={colors.subtle} size={sizes.smallIcon} />
      ) : null}
      <Text
        variant="bodyBold"
        style={styles.numeric}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}
export function WorkoutHeader({
  title,
  session,
  canFinish,
  onMinimize,
  onFinish,
}: {
  title: string;
  session: WorkoutSession;
  canFinish: boolean;
  onMinimize: () => void;
  onFinish: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const subtitle = session.status === 'active' ? title : session.status;
  return (
    <View
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      <View style={[styles.header, compact && styles.compactHeader]}>
        <IconButton
          icon="chevronDown"
          label="Minimize workout"
          onPress={onMinimize}
        />
        <View style={styles.brand}>
          <Text variant="headlineSm" numberOfLines={1} adjustsFontSizeToFit>
            REPFORGE
          </Text>
          <Text
            variant="labelSm"
            numberOfLines={1}
            style={[styles.uppercase, { color: colors.primary }]}
          >
            {subtitle}
          </Text>
        </View>
        <ElapsedClock session={session} compact={compact} />
        {session.status === 'active' ? (
          <Button
            title="Finish"
            leadingIcon={compact ? undefined : 'checkCircle'}
            size="compact"
            disabled={!canFinish}
            labelStyle={styles.sentenceCase}
            onPress={onFinish}
          />
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    minHeight: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  compactHeader: { paddingHorizontal: spacing.md },
  brand: { flex: 1, minWidth: 0, gap: spacing.micro },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  compactClock: { paddingHorizontal: spacing.xs },
  numeric: { fontVariant: ['tabular-nums'] },
  uppercase: { textTransform: 'uppercase' },
  sentenceCase: { textTransform: 'none' },
});
