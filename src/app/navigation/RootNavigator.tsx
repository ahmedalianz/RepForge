import { useTranslation } from 'react-i18next';
import { getLocalizedTypography } from '../../localization/typography';
import { getLanguage } from '../../localization/i18n';
import { languageDirection } from '../../localization/types';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { WorkoutsScreen } from '../../features/workouts/screens/WorkoutsScreen';
import { WorkoutDetailsScreen } from '../../features/workouts/screens/WorkoutDetailsScreen';
import { ProgressScreen } from '../../features/progress/screens/ProgressScreen';
import { PersonalRecordsScreen } from '../../features/progress/screens/PersonalRecordsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { GoalsScreen } from '../../features/goals/screens/GoalsScreen';
import { ExerciseDetailsScreen } from '../../features/exercises/screens/ExerciseDetailsScreen';
import { useTheme } from '../theme/ThemeProvider';
import { renderTrainingTabBar } from './TrainingTabBar';
import type { RootStackParamList, TabParamList } from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
function MainTabs() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      tabBar={renderTrainingTabBar}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceLow },
        headerTintColor: colors.text,
        headerTitleStyle: getLocalizedTypography('headlineSm'),
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'RepForge',
          tabBarLabel: t('Home'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ title: t('Workouts') }}
      />
      <Tabs.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('Profile') }}
      />
    </Tabs.Navigator>
  );
}
export function RootNavigator() {
  const { t } = useTranslation('navigation');
  const { mode, colors } = useTheme();
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.surface,
      primary: colors.primary,
      text: colors.text,
      border: colors.border,
      notification: colors.secondary,
    },
  };
  return (
    <NavigationContainer
      theme={theme}
      direction={languageDirection(getLanguage())}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: getLocalizedTypography('headlineSm'),
          headerBackTitleStyle: {
            fontFamily: getLocalizedTypography('body').fontFamily,
          },
          headerBackTitle: t('back'),
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WorkoutDetails"
          component={WorkoutDetailsScreen}
          options={{ title: t('WorkoutDetails'), headerShown: false }}
        />
        <Stack.Screen
          name="ExerciseDetails"
          component={ExerciseDetailsScreen}
          options={{ title: t('ExerciseDetails') }}
        />
        <Stack.Screen
          name="PersonalRecords"
          component={PersonalRecordsScreen}
          options={{ title: t('PersonalRecords') }}
        />
        <Stack.Screen
          name="Goals"
          component={GoalsScreen}
          options={{ title: t('Goals') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
