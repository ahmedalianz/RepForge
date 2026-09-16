import {Linking, Platform} from 'react-native';

/**
 * Best-effort open of the OS notification / app settings screen.
 * Exact destination differs by platform and OS version.
 */
export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        {
          key: 'android.provider.extra.APP_PACKAGE',
          value: 'com.rnlab.app',
        },
      ]);
      return;
    } catch {
      // Fall through to generic app settings.
    }
  }

  await Linking.openSettings();
}
