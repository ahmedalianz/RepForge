import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../app/theme/ThemeProvider';
import { spacing } from '../../app/theme/tokens';
import { Text } from './Text';
export function LoadingState({ message }: { message?: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  return (
    <View
      accessibilityRole="progressbar"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ActivityIndicator color={colors.primary} />
      {message === '' ? null : <Text>{message ?? t('loading')}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
