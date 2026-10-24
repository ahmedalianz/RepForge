import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { DAYS_PER_WEEK } from '../domain/dashboard';
import type { DashboardPresentation } from '../domain/presentation';
import { dashboardStyles as layout } from './dashboardStyles';
export function WeeklyActivity({
  dashboard,
}: {
  dashboard: DashboardPresentation;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const dayDiameter = Math.min(
    sizes.day,
    (Math.min(width, sizes.contentMax) -
      spacing.lg * 4 -
      spacing.xs * (DAYS_PER_WEEK - 1)) /
      DAYS_PER_WEEK,
  );
  return (
    <Card>
      <View style={[layout.between, layout.wrap]}>
        <View style={layout.column}>
          <Text variant="labelSm" tone="muted" style={layout.uppercase}>
            Weekly Discipline
          </Text>
          <Text variant="headlineSm">{dashboard.weeklyWorkouts}</Text>
        </View>
        <View style={[layout.badge, { backgroundColor: colors.surfaceHigh }]}>
          <Icon
            name="checkCircle"
            color={colors.primary}
            size={sizes.smallIcon}
          />
          <Text variant="labelSm" style={{ color: colors.primary }}>
            THIS WEEK
          </Text>
        </View>
      </View>
      <View style={styles.days}>
        {dashboard.days.map(day => {
          const completed = day.workouts > 0;
          const foreground = completed
            ? colors.onPrimary
            : day.isToday
              ? colors.primary
              : colors.muted;
          const background = completed
            ? colors.primary
            : day.isToday
              ? colors.primaryMuted
              : colors.surfaceLowest;
          return (
            <View
              key={day.date}
              style={styles.day}
              accessible
              accessibilityLabel={day.accessibilityLabel}
            >
              <Text
                variant="labelSm"
                style={{ color: day.isToday ? colors.primary : colors.muted }}
              >
                {day.initial}
              </Text>
              <View
                style={[
                  styles.circle,
                  { width: dayDiameter, height: dayDiameter },
                  { backgroundColor: background },
                  day.isFuture && styles.future,
                ]}
              >
                {completed ? (
                  <Icon
                    name="check"
                    size={sizes.smallIcon}
                    color={foreground}
                  />
                ) : day.isToday ? (
                  <Icon
                    name="dumbbell"
                    size={sizes.smallIcon}
                    color={foreground}
                  />
                ) : (
                  <View
                    style={[styles.dot, { backgroundColor: colors.muted }]}
                  />
                )}
              </View>
              <Text
                variant={day.isToday ? 'labelSm' : 'captionSm'}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ color: day.isToday ? colors.primary : colors.muted }}
              >
                {day.statusLabel}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.distribution}>
        <View style={[layout.between, layout.wrap]}>
          <Text variant="labelSm" tone="muted">
            Daily Load Distribution
          </Text>
          <Text variant="labelSm">
            {dashboard.weeklyVolume} {dashboard.unit} lifted
          </Text>
        </View>
        <View
          style={styles.chart}
          accessible
          accessibilityLabel={`Daily external working-set volume in ${dashboard.unit}. ${dashboard.days.map(day => `${day.label}: ${day.volume}`).join(', ')}`}
        >
          {dashboard.days.map(day => (
            <View
              key={day.date}
              style={[
                styles.bar,
                {
                  height: Math.max(
                    sizes.chartMinimum,
                    day.barRatio * sizes.chart,
                  ),
                  backgroundColor:
                    day.barTone === 'today'
                      ? colors.secondary
                      : day.barTone === 'empty'
                        ? colors.surfaceHighest
                        : colors.primary,
                  opacity: day.barOpacity,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  day: { flex: 1, alignItems: 'center', gap: spacing.xs },
  circle: {
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  future: { opacity: opacity.inactive },
  dot: { width: spacing.xs, height: spacing.xs, borderRadius: radii.full },
  distribution: { gap: spacing.sm, paddingTop: spacing.xs },
  chart: {
    height: sizes.chart,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
});
