import { formatNumber } from '../../../localization/format';
import { convertWeight, type WeightUnit } from './strength';
export function formatLoad(
  kg: number,
  unit: WeightUnit,
  compact = false,
): string {
  return formatNumber(convertWeight(kg, 'kg', unit), {
    maximumFractionDigits: 1,
    notation: compact ? 'compact' : 'standard',
  });
}
