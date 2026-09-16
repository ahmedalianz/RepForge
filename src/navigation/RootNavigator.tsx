import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RNBootSplash from 'react-native-bootsplash';
import {DiagnosticsScreen, setNavigationReady} from '../features/diagnostics';
import {DeepLinkingPlaygroundScreen} from '../features/deepLinking';
import {HomeScreen} from '../features/home';
import {
  NotificationService,
  NotificationsPlaygroundScreen,
} from '../features/notifications';
import {SslPinningPlaygroundScreen} from '../features/sslPinning';
import {logEvent} from '../services/logging';
import {colors} from '../theme';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: {backgroundColor: colors.surface},
  headerTintColor: colors.text.primary,
  headerTitleStyle: {color: colors.text.primary},
  contentStyle: {backgroundColor: colors.background},
};

export function RootNavigator() {
  useEffect(() => {
    logEvent({
      module: 'navigation',
      event: 'ROOT_NAVIGATOR_MOUNTED',
      result: 'ok',
    });
    NotificationService.initialize().catch(() => undefined);
  }, []);

  return (
    <NavigationContainer
      onReady={() => {
        setNavigationReady(true);
        logEvent({
          module: 'navigation',
          event: 'NAVIGATION_READY',
          result: 'ok',
        });
        NotificationService.onNavigationReady().catch(() => undefined);
        RNBootSplash.hide({fade: true}).catch(() => {
          // Native splash may already be dismissed in some reload paths.
        });
      }}>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Playground'}}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsPlaygroundScreen}
          options={{title: 'Push Notifications'}}
        />
        <Stack.Screen
          name="DeepLinking"
          component={DeepLinkingPlaygroundScreen}
          options={{title: 'Deep Linking'}}
        />
        <Stack.Screen
          name="SslPinning"
          component={SslPinningPlaygroundScreen}
          options={{title: 'SSL Pinning'}}
        />
        <Stack.Screen
          name="Diagnostics"
          component={DiagnosticsScreen}
          options={{title: 'Debug / Diagnostics'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
