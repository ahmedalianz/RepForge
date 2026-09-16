import {AppState, type AppStateStatus} from 'react-native';
import type {PlaygroundAppState} from '../types';

export function mapAppState(status: AppStateStatus): PlaygroundAppState {
  switch (status) {
    case 'active':
      return 'FOREGROUND';
    case 'background':
      return 'BACKGROUND';
    case 'inactive':
      return 'INACTIVE';
    case 'extension':
      return 'BACKGROUND';
    case 'unknown':
    default:
      return 'UNKNOWN';
  }
}

export function getCurrentPlaygroundAppState(): PlaygroundAppState {
  return mapAppState(AppState.currentState);
}
