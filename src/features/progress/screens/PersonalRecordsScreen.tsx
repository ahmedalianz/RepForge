import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { spacing } from '../../../app/theme/tokens';
import { Text } from '../../../shared/components/Text';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { useProgress } from '../hooks/useProgress';
import { RecordRow } from '../components/RecordHistory';
export function PersonalRecordsScreen() {
  const { t } = useTranslation('progress');
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useProgress();
  if (vm.state.status === 'loading') {
    return <LoadingState />;
  }
  if (vm.state.status === 'error') {
    return (
      <EmptyState title={t('recordsUnavailable')} message={vm.state.message}>
        <Button title={t('retry')} onPress={vm.refresh} />
      </EmptyState>
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={vm.state.snapshot.records}
        keyExtractor={record => record.setId}
        contentContainerStyle={[
          styles.list,
          {
            paddingLeft: spacing.lg + insets.left,
            paddingRight: spacing.lg + insets.right,
            paddingBottom: spacing.lg + insets.bottom,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headlineMd">{t('recordsTitle')}</Text>
            <Text tone="muted">{t('recordsDescription')}</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title={t('noRecords')} message={t('recordsEmpty')} />
        }
        renderItem={({ item }) => (
          <RecordRow
            record={item}
            unit={vm.unit}
            onOpen={sessionId =>
              navigation.navigate('WorkoutDetails', { sessionId })
            }
          />
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingTop: spacing.lg, gap: spacing.sm },
  header: { gap: spacing.sm, paddingBottom: spacing.md },
});
