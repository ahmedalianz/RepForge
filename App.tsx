import { PromptProvider } from './src/app/providers/PromptProvider';
import { LocalizationProvider } from './src/localization/LocalizationProvider';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/app/theme/ThemeProvider';
import { DatabaseProvider } from './src/app/providers/DatabaseProvider';
import { RootNavigator } from './src/app/navigation/RootNavigator';
function AppContent() {
  const { mode } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <DatabaseProvider>
        <RootNavigator />
      </DatabaseProvider>
    </>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LocalizationProvider>
          <ThemeProvider>
            <PromptProvider>
              <AppContent />
            </PromptProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
