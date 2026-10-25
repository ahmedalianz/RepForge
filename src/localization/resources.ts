import arCommon from './locales/ar-EG/common.json';
import arNavigation from './locales/ar-EG/navigation.json';
import arHome from './locales/ar-EG/home.json';
import arWorkouts from './locales/ar-EG/workouts.json';
import arExercises from './locales/ar-EG/exercises.json';
import arProgress from './locales/ar-EG/progress.json';
import arGoals from './locales/ar-EG/goals.json';
import arSettings from './locales/ar-EG/settings.json';
import arValidation from './locales/ar-EG/validation.json';
import common from './locales/en-US/common.json';
import navigation from './locales/en-US/navigation.json';
import home from './locales/en-US/home.json';
import workouts from './locales/en-US/workouts.json';
import exercises from './locales/en-US/exercises.json';
import progress from './locales/en-US/progress.json';
import goals from './locales/en-US/goals.json';
import settings from './locales/en-US/settings.json';
import validation from './locales/en-US/validation.json';
export const resources = {
  'ar-EG': {
    common: arCommon,
    navigation: arNavigation,
    home: arHome,
    workouts: arWorkouts,
    exercises: arExercises,
    progress: arProgress,
    goals: arGoals,
    settings: arSettings,
    validation: arValidation,
  },
  'en-US': {
    common,
    navigation,
    home,
    workouts,
    exercises,
    progress,
    goals,
    settings,
    validation,
  },
};
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en-US'];
    returnNull: false;
  }
}
