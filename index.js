/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {
  NotificationService,
  registerNotifeeBackgroundHandler,
} from './src/features/notifications';
import {registerFirebaseBackgroundHandler} from './src/features/notifications/services/firebaseMessaging';

// Background handlers must be registered as early as possible.
registerNotifeeBackgroundHandler();
registerFirebaseBackgroundHandler(async remoteMessage => {
  await NotificationService.handleBackgroundRemoteMessage(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
