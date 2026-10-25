import { StyleSheet } from 'react-native';
import { sizes, spacing } from '../../../app/theme/tokens';
export const COMPACT_SET_TABLE_WIDTH = 430;
export const setLayout = StyleSheet.create({
  row: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  index: { width: 40, alignItems: 'center' },
  previous: { writingDirection: 'ltr', width: 60, textAlign: 'center' },
  numeric: {
    writingDirection: 'ltr',
    flex: 1,
    minWidth: sizes.touchTarget,
    textAlign: 'center',
  },
  complete: { width: sizes.touchTarget, textAlign: 'center' },
});
