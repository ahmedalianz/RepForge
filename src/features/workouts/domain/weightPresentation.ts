import { convertWeight, type WeightUnit } from './strength';
export function formatLoad(
  kg: number,
  unit: WeightUnit,
  compact = false,
): string {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    notation: compact ? 'compact' : 'standard',
  }).format(convertWeight(kg, 'kg', unit));
}
