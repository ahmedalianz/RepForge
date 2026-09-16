import notifee, {EventType} from '@notifee/react-native';
import {buildAppNotification} from '../utils/validatePayload';
import {NotificationService} from './NotificationService';

let registered = false;

/**
 * Notifee requires the background event handler to be registered early
 * (ideally near the JS entry). Idempotent.
 */
export function registerNotifeeBackgroundHandler(): void {
  if (registered) {
    return;
  }
  registered = true;

  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type !== EventType.PRESS || !detail.notification) {
      return;
    }

    const notification = buildAppNotification({
      id: detail.notification.id,
      title: detail.notification.title ?? undefined,
      body: detail.notification.body ?? undefined,
      data: detail.notification.data as Record<string, unknown> | undefined,
      raw: detail.notification,
    });

    await NotificationService.initialize();
    await NotificationService.handleOpened(notification, 'notifee');
  });
}
