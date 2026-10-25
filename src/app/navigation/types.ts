import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
export type TabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Profile: undefined;
};
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  WorkoutDetails: { sessionId: string };
  ExerciseDetails: { exerciseId: string } | undefined;
  PersonalRecords: undefined;
  Goals: undefined;
};
export type RootScreenProps<Route extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Route>;
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
