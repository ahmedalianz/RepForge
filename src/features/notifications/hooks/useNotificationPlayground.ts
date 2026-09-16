import {useCallback, useEffect, useState} from 'react';
import {
  clearNotificationLogs,
  getNotificationLogEntries,
  subscribeToNotificationLogs,
  type NotificationLogEntry,
} from '../notificationLogger';
import {
  NotificationService,
  type NotificationServiceSnapshot,
} from '../services/NotificationService';
import {openNotificationSettings} from '../utils/openNotificationSettings';

export function useNotificationPlayground() {
  const [snapshot, setSnapshot] = useState<NotificationServiceSnapshot>(
    NotificationService.getSnapshot(),
  );
  const [logs, setLogs] = useState<NotificationLogEntry[]>(
    getNotificationLogEntries(),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    NotificationService.initialize().catch(() => undefined);
    const unsubService = NotificationService.subscribe(setSnapshot);
    const unsubLogs = subscribeToNotificationLogs(setLogs);
    return () => {
      unsubService();
      unsubLogs();
    };
  }, []);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    snapshot,
    logs,
    busy,
    checkPermission: () => run(() => NotificationService.checkPermission()),
    requestPermission: () => run(() => NotificationService.requestPermission()),
    openSettings: () => run(() => openNotificationSettings()),
    getToken: () => run(() => NotificationService.getToken()),
    refreshToken: () => run(() => NotificationService.refreshToken()),
    clearToken: () => run(() => NotificationService.clearToken()),
    clearLogs: () => clearNotificationLogs(),
    simulateForeground: () =>
      run(() => NotificationService.simulateForegroundNotification()),
    simulateTap: () => run(() => NotificationService.simulateNotificationTap()),
    simulateInitial: () =>
      run(() => NotificationService.simulateInitialNotification()),
    simulateDuplicate: () =>
      run(() => NotificationService.simulateDuplicateNotification()),
    simulateInvalid: () =>
      run(() => NotificationService.simulateInvalidPayload()),
    simulateTokenRefresh: () =>
      run(() => NotificationService.simulateTokenRefresh()),
  };
}
