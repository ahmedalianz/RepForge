import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { spacing } from '../../../app/theme/tokens';
import { TrainingHeader } from '../../../shared/components/TrainingHeader';
import { Screen } from '../../../shared/components/Screen';
import { Text } from '../../../shared/components/Text';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ExercisePicker } from '../../exercises/components/ExercisePicker';
import { useProgress } from '../hooks/useProgress';
import { AnalyticsFilters } from '../components/AnalyticsFilters';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { AnalyticsMetrics } from '../components/AnalyticsMetrics';
import { VolumeSplit } from '../components/VolumeSplit';
import { RecordHistory } from '../components/RecordHistory';
import { TrainingSummary } from '../components/TrainingSummary';
export function ProgressScreen() {
  const { t } = useTranslation('progress');
  const navigation = useNavigation();
  const { colors } = useTheme();
  const vm = useProgress();
  const [picker, setPicker] = useState(false);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrainingHeader
        streak={
          vm.summary ? t('streak', { count: vm.summary.streakDays }) : undefined
        }
        onProfile={() => navigation.navigate('Main', { screen: 'Profile' })}
      />
      {vm.state.status === 'loading' ? (
        <LoadingState message={t('loading')} />
      ) : vm.state.status === 'error' ? (
        <Screen>
          <EmptyState title={t('unavailable')} message={vm.state.message}>
            <Button title={t('retry')} onPress={vm.refresh} />
          </EmptyState>
        </Screen>
      ) : vm.summary ? (
        <>
          <Screen contentStyle={styles.content}>
            <AnalyticsFilters vm={vm} onChoose={() => setPicker(true)} />
            {vm.exercise && vm.exercise.exerciseType !== 'external' ? (
              <Text tone="muted">{t('bodyweightNote')}</Text>
            ) : null}
            <AnalyticsChart
              key={`${vm.view}:${vm.range}:${vm.exercise?.id}:${vm.unit}`}
              vm={vm}
            />
            <AnalyticsMetrics
              summary={vm.summary}
              range={vm.range}
              unit={vm.unit}
            />
            <VolumeSplit weeks={vm.summary.weeks} />
            <RecordHistory
              records={vm.state.snapshot.records}
              unit={vm.unit}
              onHistory={() => navigation.navigate('PersonalRecords')}
              onOpen={sessionId =>
                navigation.navigate('WorkoutDetails', { sessionId })
              }
            />
            <TrainingSummary vm={vm} />
            <Button
              title={t('goals')}
              variant="secondary"
              onPress={() => navigation.navigate('Goals')}
            />
          </Screen>
          <ExercisePicker
            mode="select"
            visible={picker}
            selectedIds={vm.exercise ? [vm.exercise.id] : []}
            onSelect={id => {
              vm.setExerciseId(id);
              return true;
            }}
            onClose={() => setPicker(false)}
          />
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
});
