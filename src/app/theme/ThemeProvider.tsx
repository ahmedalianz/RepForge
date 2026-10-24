import { createContext, useContext, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { usePreferencesStore } from '../config/preferencesStore';
import { darkColors, lightColors, type ThemeColors } from './tokens';
type Theme = { mode: 'light' | 'dark'; colors: ThemeColors };
const themes: Record<'light' | 'dark', Theme> = {
  dark: { mode: 'dark', colors: darkColors },
  light: { mode: 'light', colors: lightColors },
};
const ThemeContext = createContext<Theme>(themes.dark);
export function ThemeProvider({ children }: PropsWithChildren) {
  const preference = usePreferencesStore(state => state.theme);
  const system = useColorScheme();
  const mode = preference === 'system' ? (system ?? 'dark') : preference;
  return (
    <ThemeContext.Provider value={themes[mode]}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
