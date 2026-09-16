/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {registerNotifeeBackgroundHandler} from './src/features/notifications';

// Notifee background presses must be registered early in the JS runtime.
registerNotifeeBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
