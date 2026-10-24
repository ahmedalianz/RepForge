import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, sizes, spacing } from '../../../app/theme/tokens';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { dashboardStyles as layout } from './dashboardStyles';
export function WorkoutHero({
  greeting,
  hasActiveSession,
  onStart,
}: {
  greeting: string;
  hasActiveSession: boolean;
  onStart: () => void;
}) {
  const { colors } = useTheme();
  const heading = hasActiveSession
    ? 'Continue your workout'
    : 'Freestyle workout';
  const action = hasActiveSession ? 'Resume Workout' : 'Start Workout';
  const subtitle = hasActiveSession
    ? 'Your session is saved • Pick up where you left off'
    : 'Choose exercises • Set your pace • Log sets';
  return (
    <>
      <View style={styles.intro}>
        <View style={styles.greeting}>
          <Text variant="labelSm" tone="muted" style={layout.uppercase}>
            Your training, forged daily
          </Text>
          <Text variant="title" style={layout.uppercase}>
            {greeting}
          </Text>
        </View>
        <View style={[styles.next, { backgroundColor: colors.surfaceLow }]}>
          <Icon
            name="calendar"
            color={colors.secondary}
            size={sizes.smallIcon}
          />
          <Text numberOfLines={1} style={styles.nextText} tone="muted">
            Next: <Text variant="bodyBold">{heading}</Text>
            {hasActiveSession ? ' • In progress' : ' • Ready when you are'}
          </Text>
        </View>
      </View>
      <Card style={styles.hero}>
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient
                id="hero-deck"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0" stopColor={colors.surface} />
                <Stop offset="1" stopColor={colors.surfaceHigh} />
              </LinearGradient>
              <RadialGradient id="hero-tint" cx="95%" cy="0%" r="90%">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.1} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#hero-deck)" />
            <Rect width="100%" height="100%" fill="url(#hero-tint)" />
          </Svg>
        </View>
        <View style={[layout.between, layout.wrap]}>
          <View style={layout.row}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text
              variant="labelSm"
              style={[layout.uppercase, { color: colors.primary }]}
            >
              {hasActiveSession ? 'Workout in progress' : 'Your next workout'}
            </Text>
          </View>
          <View
            style={[
              styles.localBadge,
              { backgroundColor: colors.surfaceLowest },
            ]}
          >
            <Text variant="labelSm" tone="muted">
              OFFLINE READY
            </Text>
          </View>
        </View>
        <View style={styles.details}>
          <Text variant="headlineMd">{heading}</Text>
          <Text tone="muted">{subtitle}</Text>
        </View>
        <Button
          title={action}
          leadingIcon="play"
          trailingIcon="arrowRight"
          onPress={onStart}
        />
      </Card>
    </>
  );
}
const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  greeting: { gap: spacing.xs },
  next: {
    padding: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextText: { flex: 1 },
  hero: { gap: spacing.lg, overflow: 'hidden' },
  details: { gap: spacing.xs },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radii.full },
  localBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.micro,
    borderRadius: radii.sm,
  },
});
