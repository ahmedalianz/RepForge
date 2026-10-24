import type { WeightUnit } from '../../features/workouts/domain/strength';
import type { Database } from '../../database/types';
export type ThemePreference = 'dark' | 'light' | 'system';
export type Preferences = { theme: ThemePreference; weightUnit: WeightUnit };
export function loadPreferences(database: Database): Preferences {
  const row = database.execute(
    'SELECT theme, weight_unit FROM app_preferences WHERE id = 1',
  ).rows[0];
  if (
    !row ||
    !['dark', 'light', 'system'].includes(String(row.theme)) ||
    !['kg', 'lb'].includes(String(row.weight_unit))
  ) {
    throw new Error('Saved preferences are invalid');
  }
  return {
    theme: row.theme as ThemePreference,
    weightUnit: row.weight_unit as WeightUnit,
  };
}
export function savePreferences(
  database: Database,
  preferences: Preferences,
): void {
  database.execute(
    'UPDATE app_preferences SET theme = ?, weight_unit = ? WHERE id = 1',
    [preferences.theme, preferences.weightUnit],
  );
}
