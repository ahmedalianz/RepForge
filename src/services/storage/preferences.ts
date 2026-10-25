import type { AppLanguage } from '../../localization/types';
import type { WeightUnit } from '../../features/workouts/domain/strength';
import type { Database } from '../../database/types';
export type ThemePreference = 'dark' | 'light' | 'system';
export type Preferences = {
  theme: ThemePreference;
  weightUnit: WeightUnit;
  language: AppLanguage;
};
export function loadPreferences(database: Database): Preferences {
  const row = database.execute(
    'SELECT theme, weight_unit, language FROM app_preferences WHERE id = 1',
  ).rows[0];
  if (
    !row ||
    !['dark', 'light', 'system'].includes(String(row.theme)) ||
    !['kg', 'lb'].includes(String(row.weight_unit)) ||
    !['ar-EG', 'en-US'].includes(String(row.language))
  ) {
    throw new Error('Saved preferences are invalid');
  }
  return {
    theme: row.theme as ThemePreference,
    weightUnit: row.weight_unit as WeightUnit,
    language: row.language as AppLanguage,
  };
}
export function savePreferences(
  database: Database,
  preferences: Preferences,
): void {
  database.execute(
    'UPDATE app_preferences SET theme = ?, weight_unit = ?, language = ? WHERE id = 1',
    [preferences.theme, preferences.weightUnit, preferences.language],
  );
}
