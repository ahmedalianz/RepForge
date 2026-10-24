import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {Screen} from '../../../components/Screen';
import {colors, typography} from '../../../theme';
import {AppStatePanel} from '../components/AppStatePanel';
import {NotificationEventLog} from '../components/NotificationEventLog';
import {PermissionPanel} from '../components/PermissionPanel';
import {SimulationPanel} from '../components/SimulationPanel';
import {TokenPanel} from '../components/TokenPanel';
import {useNotificationPlayground} from '../hooks/useNotificationPlayground';

export function NotificationsPlaygroundScreen() {
  const playground = useNotificationPlayground();
  const {snapshot} = playground;

  return (
    <Screen>
      <Text style={styles.lead}>
        Real remote push lab (Phase 2.5). When Firebase credentials are present,
        FCM drives remote delivery; Notifee handles channels and foreground
        presentation. Without credentials the service stays honest and
        simulations still exercise the same pipelines.
      </Text>

      <PermissionPanel
        status={snapshot.permissionStatus}
        busy={playground.busy}
        onCheck={playground.checkPermission}
        onRequest={playground.requestPermission}
        onOpenSettings={playground.openSettings}
      />

      <TokenPanel
        token={snapshot.token}
        tokenStatus={snapshot.tokenStatus}
        remoteTransport={snapshot.remoteTransport}
        firebaseConfigured={snapshot.firebaseConfigured}
        fcmAvailable={snapshot.fcmAvailable}
        apnsDeviceToken={snapshot.apnsDeviceToken}
        lastError={snapshot.lastError}
        busy={playground.busy}
        onGet={playground.getToken}
        onRefresh={playground.refreshToken}
        onClear={playground.clearToken}
      />

      <AppStatePanel
        appState={snapshot.appState}
        lastChangeAt={snapshot.lastAppStateChangeAt}
        pendingCount={snapshot.pendingCount}
      />

      <SimulationPanel
        busy={playground.busy}
        onForeground={playground.simulateForeground}
        onTap={playground.simulateTap}
        onInitial={playground.simulateInitial}
        onDuplicate={playground.simulateDuplicate}
        onInvalid={playground.simulateInvalid}
        onTokenRefresh={playground.simulateTokenRefresh}
      />

      <NotificationEventLog
        entries={playground.logs}
        onClear={playground.clearLogs}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
