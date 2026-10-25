import {
  formatNumber,
  formatDate,
  formatPercent,
  unitLabel,
  ltrText,
} from '../../../localization/format';
import { useTranslation } from 'react-i18next';
import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { spacing } from '../../../app/theme/tokens';
import { Card } from '../../../shared/components/Card';
import { Text } from '../../../shared/components/Text';
import { EmptyState } from '../../../shared/components/EmptyState';
import { IconButton } from '../../../shared/components/IconButton';
import { convertWeight } from '../../workouts/domain/strength';
import { formatLoad } from '../../workouts/domain/weightPresentation';
import type { ProgressViewModel } from '../hooks/useProgress';
import type { ChartPoint } from '../domain/types';
function dateLabel(date: number) {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
  });
}
export function AnalyticsChart({ vm }: { vm: ProgressViewModel }) {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  const gradient = `trajectory-${useId().replace(/:/g, '')}`;
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const summary = vm.summary!;
  const strength = vm.view === 'strength';
  const consistency = vm.view === 'consistency';
  const title = strength
    ? t('strengthChart')
    : consistency
      ? t('consistencyChart')
      : t('volumeChart');
  const source = strength
    ? summary.points
    : consistency
      ? summary.activityPoints
      : summary.volumePoints;
  const points: ChartPoint[] = source.map(point => ({
    ...point,
    value: consistency
      ? point.value
      : convertWeight(point.value, 'kg', vm.unit),
  }));
  const requestedIndex = points.findIndex(point => point.date === selectedDate);
  // Follow the latest day until the user inspects a date; use latest if it disappears.
  const index = requestedIndex < 0 ? points.length - 1 : requestedIndex;
  const selected = points[index];
  const formatted = (value: number) =>
    consistency
      ? t('workoutsCount', { count: value })
      : ltrText(`${formatLoad(value, 'kg')} ${unitLabel(vm.unit)}`);
  const max = Math.max(...points.map(point => point.value), 0);
  const scale = Math.max(max, 1);
  const first = points[0];
  const last = points[points.length - 1];
  const x = (point: ChartPoint) =>
    first && last && last.date !== first.date
      ? 12 + ((point.date - first.date) / (last.date - first.date)) * 336
      : 180;
  const y = (point: ChartPoint) => 152 - (point.value / scale) * 132;
  const path = points
    .map((point, at) => `${at ? 'L' : 'M'}${x(point)},${y(point)}`)
    .join(' ');
  const change = strength
    ? summary.estimateChangePercent
    : summary.volumeChangePercent;
  return (
    <Card>
      <View style={styles.heading}>
        <Text variant="labelSm" tone="muted" style={styles.upper}>
          {title}
        </Text>
        {strength ? (
          <Text variant="labelSm" tone="muted">
            {t('formula')}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <>
          <View style={styles.metric}>
            <Text variant="metricMd">
              {consistency
                ? formatNumber(selected.value)
                : formatLoad(selected.value, 'kg')}
            </Text>
            <Text variant="labelMd" tone="muted">
              {consistency ? t('workoutsLabel') : unitLabel(vm.unit)}
            </Text>
            {!consistency && change !== null ? (
              <Text variant="labelSm" style={{ color: colors.primary }}>
                {formatPercent(change, 1, true)}
              </Text>
            ) : null}
          </View>
          {strength && summary.best ? (
            <Text variant="labelSm" tone="muted">
              {t('recordLoad', {
                weight: formatLoad(summary.best.weightKg!, vm.unit),
                unit: unitLabel(vm.unit),
                reps: formatNumber(summary.best.reps),
              })}
            </Text>
          ) : null}
          <View
            accessible
            accessibilityRole="image"
            style={styles.chart}
            accessibilityLabel={t('chartAccessibility', {
              title,
              date: dateLabel(selected.date),
              value: formatted(selected.value),
              days: formatNumber(points.length),
              dayType: t(consistency ? 'calendarDays' : 'trainingDaysLabel'),
              note: strength ? t('estimateNote') : '',
            })}
          >
            <Svg
              width="100%"
              height={180}
              viewBox="0 0 360 170"
              accessibilityElementsHidden
            >
              <Defs>
                <LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={colors.primary}
                    stopOpacity={0.35}
                  />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {[20, 64, 108, 152].map(level => (
                <Line
                  key={level}
                  x1={12}
                  x2={348}
                  y1={level}
                  y2={level}
                  stroke={colors.border}
                  strokeDasharray="3 5"
                />
              ))}
              {points.length > 1 ? (
                <Path
                  d={`${path} L${x(last!)},152 L${x(first!)},152 Z`}
                  fill={`url(#${gradient})`}
                />
              ) : null}
              <Path
                d={path}
                stroke={colors.primary}
                strokeWidth={3}
                fill="none"
              />
              {points.map((point, at) => (
                <Circle
                  key={point.date}
                  cx={x(point)}
                  cy={y(point)}
                  r={at === index ? 5 : 2.5}
                  fill={colors.primary}
                  stroke={colors.surfaceLowest}
                  strokeWidth={1.5}
                />
              ))}
            </Svg>
          </View>
          <View style={[styles.heading, styles.chart]}>
            <Text variant="labelSm" tone="muted">
              {dateLabel(first!.date)}
            </Text>
            <Text variant="labelSm" style={{ color: colors.primary }}>
              {t('peak', { value: formatted(max) })}
            </Text>
            <Text variant="labelSm" tone="muted">
              {dateLabel(last!.date)}
            </Text>
          </View>
          <View style={styles.inspect}>
            <IconButton
              icon="arrowLeft"
              mirrorInRTL={false}
              label={t('previousPoint')}
              disabled={index === 0}
              onPress={() => setSelectedDate(points[index - 1]?.date ?? null)}
              variant="ghost"
            />
            <Text variant="labelSm" tone="muted" style={styles.selected}>
              {dateLabel(selected.date)} • {formatted(selected.value)}
            </Text>
            <IconButton
              icon="arrowRight"
              mirrorInRTL={false}
              label={t('nextPoint')}
              disabled={index === points.length - 1}
              onPress={() => setSelectedDate(points[index + 1]?.date ?? null)}
              variant="ghost"
            />
          </View>
        </>
      ) : (
        <EmptyState
          title={strength ? t('noStrength') : t('noTraining')}
          message={strength ? t('strengthEmpty') : t('trainingEmpty')}
        />
      )}
      <Text variant="captionSm" tone="muted">
        {strength
          ? t('strengthNote')
          : consistency
            ? t('consistencyNote')
            : t('volumeNote')}
      </Text>
    </Card>
  );
}
const styles = StyleSheet.create({
  chart: { direction: 'ltr' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  upper: { textTransform: 'uppercase', flexShrink: 1 },
  metric: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  inspect: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { flex: 1, textAlign: 'center' },
});
