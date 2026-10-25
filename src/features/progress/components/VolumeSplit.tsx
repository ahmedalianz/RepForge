import { useTranslation } from 'react-i18next';
import { formatNumber, formatPercent } from '../../../localization/format';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { radii, spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Text } from '../../../shared/components/Text';
import { Icon } from '../../../shared/components/Icon';
import type { Split, TrainingWeek } from '../domain/types';
const splits: Split[] = ['push', 'pull', 'legs', 'other'];
export function VolumeSplit({ weeks }: { weeks: TrainingWeek[] }) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  const palette = {
    push: colors.primary,
    pull: colors.secondary,
    legs: colors.surfaceHighest,
    other: colors.milestone,
  };
  const totalFor = (week: TrainingWeek) =>
    splits.reduce((sum, split) => sum + week[split], 0);
  const totals = Object.fromEntries(
    splits.map(split => [
      split,
      weeks.reduce((sum, week) => sum + week[split], 0),
    ]),
  ) as Record<Split, number>;
  const total = splits.reduce((sum, split) => sum + totals[split], 0);
  const max = Math.max(...weeks.map(totalFor), 1);
  return (
    <Card>
      <View style={styles.heading}>
        <View style={styles.title}>
          <Text variant="headlineSm">{t('splitTitle')}</Text>
          <Text variant="labelSm" tone="muted">
            {t('splitSubtitle')}
          </Text>
        </View>
        <Icon name="chart" color={colors.muted} />
      </View>
      <View
        style={styles.chart}
        accessible
        accessibilityLabel={t('splitAccessibility', {
          weeks: weeks
            .map((week, index) =>
              t('splitWeek', {
                week: formatNumber(index + 1),
                values: splits
                  .map(
                    split =>
                      `${formatNumber(week[split])} ${t(`split.${split}`)}`,
                  )
                  .join(', '),
              }),
            )
            .join('. '),
        })}
      >
        {weeks.map((week, index) => (
          <View key={week.date} style={styles.column}>
            <View style={styles.barSpace}>
              <View
                style={[styles.bar, { height: (totalFor(week) / max) * 128 }]}
              >
                {[...splits].reverse().map(split =>
                  week[split] ? (
                    <View
                      key={split}
                      style={{
                        backgroundColor: palette[split],
                        height: (week[split] / max) * 128,
                      }}
                    />
                  ) : null,
                )}
              </View>
              {!totalFor(week) ? (
                <View
                  style={[
                    styles.zero,
                    { backgroundColor: colors.surfaceHighest },
                  ]}
                />
              ) : null}
            </View>
            <Text
              variant="labelSm"
              style={{
                color:
                  index === weeks.length - 1 ? colors.primary : colors.muted,
              }}
            >
              {index === weeks.length - 1
                ? t('now')
                : t('weekShort', { count: index + 1 })}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        {splits
          .filter(split => split !== 'other' || totals.other > 0)
          .map(split => (
            <View key={split} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: palette[split] }]} />
              <Text variant="labelSm" style={styles.capitalize}>
                {t(`split.${split}`)} (
                {formatPercent(total ? (totals[split] / total) * 100 : 0, 0)})
              </Text>
            </View>
          ))}
      </View>
      {!total ? (
        <Text tone="muted" variant="captionSm">
          {t('splitEmpty')}
        </Text>
      ) : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, gap: spacing.xs },
  chart: { direction: 'ltr', flexDirection: 'row', gap: spacing.md },
  column: { flex: 1, alignItems: 'center', gap: spacing.sm },
  barSpace: {
    height: 136,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    maxWidth: 32,
    overflow: 'hidden',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  zero: { height: spacing.xs, width: '80%', borderRadius: radii.sm },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radii.full },
  capitalize: { textTransform: 'capitalize' },
});
