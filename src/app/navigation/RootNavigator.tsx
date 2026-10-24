import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { WorkoutsScreen } from '../../features/workouts/screens/WorkoutsScreen';
import { StartWorkoutScreen } from '../../features/workouts/screens/StartWorkoutScreen';
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
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      tabBar={renderTrainingTabBar}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceLow },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'RepForge', tabBarLabel: 'Home', headerShown: false }}
      />
      <Tabs.Screen name="Workouts" component={WorkoutsScreen} />
      <Tabs.Screen name="Progress" component={ProgressScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
export function RootNavigator() {
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
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StartWorkout"
          component={StartWorkoutScreen}
          options={{ title: 'Start Workout' }}
        />
        <Stack.Screen
          name="WorkoutDetails"
          component={WorkoutDetailsScreen}
          options={{ title: 'Active Workout', headerShown: false }}
        />
        <Stack.Screen
          name="ExerciseDetails"
          component={ExerciseDetailsScreen}
          options={{ title: 'Exercise Details' }}
        />
        <Stack.Screen
          name="PersonalRecords"
          component={PersonalRecordsScreen}
          options={{ title: 'Personal Records' }}
        />
        <Stack.Screen name="Goals" component={GoalsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
