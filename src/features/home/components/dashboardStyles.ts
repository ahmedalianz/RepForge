import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../../app/theme/tokens';
export const dashboardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  column: { gap: spacing.xs, flex: 1 },
  wrap: { flexWrap: 'wrap' },
  uppercase: { textTransform: 'uppercase' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  inset: {
    flex: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricRow: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
