import {Platform} from 'react-native';

export type FirebaseRuntimeStatus = {
  /** JS packages are installed. */
  packagesInstalled: true;
  /** Native Firebase app appears initialized (getApps().length > 0). */
  nativeConfigured: boolean;
  /** Messaging module can be constructed without throwing. */
  messagingAvailable: boolean;
  detail: string;
};

/**
 * Runtime probe — does NOT invent credentials.
 * Without google-services.json / GoogleService-Info.plist, nativeConfigured is false.
 */
export function probeFirebaseRuntime(): FirebaseRuntimeStatus {
  try {
    const {getApps} = require('@react-native-firebase/app') as {
      getApps: () => unknown[];
    };
    const {getMessaging} = require('@react-native-firebase/messaging') as {
      getMessaging: () => unknown;
    };

    const apps = getApps();
    const nativeConfigured = Array.isArray(apps) && apps.length > 0;

    let messagingAvailable = false;
    if (nativeConfigured) {
      try {
        getMessaging();
        messagingAvailable = true;
      } catch (error) {
        return {
          packagesInstalled: true,
          nativeConfigured,
          messagingAvailable: false,
          detail: `getMessaging failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }

    return {
      packagesInstalled: true,
      nativeConfigured,
      messagingAvailable,
      detail: nativeConfigured
        ? `Firebase native app present on ${Platform.OS}`
        : Platform.OS === 'android'
          ? 'Missing android/app/google-services.json (see .example). Google Services plugin not applied.'
          : 'Missing ios/RNLab/GoogleService-Info.plist (see .example) or not added to the Xcode target.',
    };
  } catch (error) {
    return {
      packagesInstalled: true,
      nativeConfigured: false,
      messagingAvailable: false,
      detail: `Firebase probe failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
