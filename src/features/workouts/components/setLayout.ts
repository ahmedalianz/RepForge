import { StyleSheet } from 'react-native';
import { sizes, spacing } from '../../../app/theme/tokens';
export const COMPACT_SET_TABLE_WIDTH = 430;
export const setLayout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  index: { width: 40, alignItems: 'center' },
  previous: { width: 60, textAlign: 'center' },
  numeric: { flex: 1, minWidth: sizes.touchTarget, textAlign: 'center' },
  complete: { width: sizes.touchTarget, textAlign: 'center' },
});
