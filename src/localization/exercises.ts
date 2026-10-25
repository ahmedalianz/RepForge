import { getLanguage } from './i18n';
import arabic from './locales/ar-EG/exercises.json';

export function getExerciseName(id: string, originalName: string): string {
  const names: Record<string, string> = arabic.names;
  return getLanguage() === 'ar-EG' && Object.hasOwn(names, id)
    ? (names[id] ?? originalName)
    : originalName;
}
function catalogLabel(
  section: 'muscles' | 'equipment' | 'types' | 'categories',
  canonical: string,
): string {
  const labels: Record<string, string> = arabic[section];
  return getLanguage() === 'ar-EG' && Object.hasOwn(labels, canonical)
    ? (labels[canonical] ?? canonical)
    : canonical;
}
export const getMuscleName = (canonical: string): string =>
  catalogLabel('muscles', canonical);
export const getEquipmentName = (canonical: string): string =>
  catalogLabel('equipment', canonical);
export const getExerciseTypeName = (canonical: string): string =>
  catalogLabel('types', canonical);
export const getExerciseCategoryName = (canonical: string): string =>
  catalogLabel('categories', canonical);

/** Arabic matches supplement canonical SQL search in either app language. */
export function getExerciseSearchMatches(query: string): {
  ids: string[];
  muscles: string[];
  equipment: string[];
} {
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (values: Record<string, string>): string[] =>
    Object.entries(values)
      .filter(([, label]) => label.toLocaleLowerCase().includes(normalized))
      .map(([canonical]) => canonical);
  return {
    ids: matches(arabic.names),
    muscles: matches(arabic.muscles),
    equipment: matches(arabic.equipment),
  };
}
