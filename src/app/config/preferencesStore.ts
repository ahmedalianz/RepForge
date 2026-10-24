import { create } from 'zustand';
import type { Preferences } from '../../services/storage/preferences';
type PreferencesState = Preferences & {
  setPreferences: (preferences: Preferences) => void;
};
/** Hydrated from SQLite on startup; writes are persisted before updating this UI cache. */
export const usePreferencesStore = create<PreferencesState>(set => ({
  theme: 'dark',
  weightUnit: 'kg',
  setPreferences: preferences => set(preferences),
}));
