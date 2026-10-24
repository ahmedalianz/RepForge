import React, {useEffect, useState} from 'react';
import {
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Screen} from '../../../components/Screen';
import {SectionCard} from '../../../components/SectionCard';
import {StatusRow} from '../../../components/StatusRow';
import {
  clearLogs,
  getLatestLogForModule,
  subscribeToLogs,
  type StructuredLogEntry,
} from '../../../services/logging';
import {colors, spacing, typography} from '../../../theme';
import {getReactNativeVersion} from '../../../utils/platformInfo';
import {
  getDiagnosticsSnapshot,
  subscribeToDiagnostics,
  type DiagnosticsSnapshot,
} from '../services/diagnosticsStore';

function formatPayload(payload: unknown): string {
  if (payload === undefined) {
    return '—';
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

export function DiagnosticsScreen() {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot>(
    getDiagnosticsSnapshot,
  );
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const unsubscribeDiagnostics = subscribeToDiagnostics(setSnapshot);
    const unsubscribeLogs = subscribeToLogs(setLogs);
    const appStateSub = AppState.addEventListener('change', setAppState);

    return () => {
      unsubscribeDiagnostics();
      unsubscribeLogs();
      appStateSub.remove();
    };
  }, []);

  const lastNotification = getLatestLogForModule('notifications');
  const lastDeepLink = getLatestLogForModule('deep-linking');

  return (
    <Screen>
      <Text style={styles.lead}>
        Live runtime snapshot. Feature modules write here as they are
        implemented.
      </Text>

      <SectionCard title="Runtime">
        <StatusRow label="React Native" value={getReactNativeVersion()} />
        <StatusRow label="Platform" value={Platform.OS} />
        <StatusRow label="OS version" value={String(Platform.Version)} />
        <StatusRow label="App state" value={appState} />
        <StatusRow
          label="Navigation ready"
          value={snapshot.navigationReady ? 'yes' : 'no'}
        />
      </SectionCard>

      <SectionCard
        title="Push Notifications"
        meta={snapshot.push.fcmStatus ?? 'stub'}>
        <StatusRow
          label="Firebase"
          value={snapshot.push.firebaseConfigured ?? 'NOT CONFIGURED'}
        />
        <StatusRow label="FCM" value={snapshot.push.fcmStatus ?? 'UNAVAILABLE'} />
        <StatusRow
          label="Permission"
          value={snapshot.push.permissionStatus}
        />
        <StatusRow label="Token status" value={snapshot.push.tokenStatus} />
        <StatusRow
          label="Token source"
          value={snapshot.push.tokenSource ?? 'none'}
        />
        <StatusRow
          label="FCM token"
          value={snapshot.push.fcmTokenPreview ?? 'none'}
        />
        <StatusRow
          label="Last remote message"
          value={snapshot.push.lastRemoteMessage ?? 'none'}
        />
        <StatusRow
          label="Last tap"
          value={snapshot.push.lastTap ?? 'none'}
        />
        <StatusRow
          label="Last error"
          value={snapshot.push.lastError ?? 'none'}
        />
        <StatusRow
          label="Last event"
          value={
            lastNotification
              ? `${lastNotification.event} @ ${lastNotification.timestamp}`
              : snapshot.push.lastEventSummary ?? 'none'
          }
        />
      </SectionCard>

      <SectionCard title="Deep Linking" meta="stub">
        <StatusRow
          label="Last URL"
          value={snapshot.deepLinking.lastUrl ?? 'none'}
        />
        <StatusRow
          label="Queue size"
          value={String(snapshot.deepLinking.queueSize)}
        />
        <StatusRow
          label="Last event"
          value={
            lastDeepLink
              ? `${lastDeepLink.event} @ ${lastDeepLink.timestamp}`
              : snapshot.deepLinking.lastEventSummary ?? 'none'
          }
        />
      </SectionCard>

      <SectionCard title="SSL Pinning" meta="stub">
        <StatusRow label="Mode" value={snapshot.sslPinning.mode} />
        <StatusRow
          label="Last request"
          value={snapshot.sslPinning.lastRequestSummary ?? 'none'}
        />
      </SectionCard>

      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>Structured event log</Text>
        <Pressable
          accessibilityRole="button"
          onPress={clearLogs}
          style={styles.clearButton}>
          <Text style={styles.clearLabel}>Clear</Text>
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <Text style={styles.empty}>No events yet.</Text>
      ) : (
        logs.slice(0, 40).map(entry => (
          <View key={entry.id} style={styles.logCard}>
            <Text style={styles.logMeta}>
              {entry.timestamp} · {entry.module} · {entry.appState ?? '—'}
            </Text>
            <Text style={styles.logEvent}>{entry.event}</Text>
            <Text style={styles.logLine}>
              result: {entry.result ?? '—'}
              {entry.error ? ` · error: ${entry.error}` : ''}
            </Text>
            <Text style={styles.logPayload}>
              payload: {formatPayload(entry.payload)}
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.text.secondary,
  },
  logHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearLabel: {
    ...typography.caption,
    color: colors.accent,
  },
  empty: {
    ...typography.body,
    color: colors.text.muted,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  logMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  logEvent: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  logLine: {
    ...typography.mono,
    color: colors.text.secondary,
  },
  logPayload: {
    ...typography.mono,
    color: colors.info,
  },
});
