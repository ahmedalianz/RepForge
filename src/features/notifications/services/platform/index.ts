import {Platform} from 'react-native';
import {createAndroidPushAdapter} from './androidPush';
import {createIosPushAdapter} from './iosPush';
import type {PlatformPushAdapter} from './types';

export function createPlatformPushAdapter(): PlatformPushAdapter {
  if (Platform.OS === 'ios') {
    return createIosPushAdapter();
  }
  return createAndroidPushAdapter();
}

export type {PlatformPushAdapter} from './types';
