import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SectionCard} from '../../../components/SectionCard';
import {colors, spacing, typography} from '../../../theme';
import type {NotificationLogEntry} from '../notificationLogger';
import {LabButton} from './LabButton';

type Props = {
  entries: NotificationLogEntry[];
  onClear: () => void;
};

function formatPayload(payload: unknown): string {
  if (payload === undefined) {
    return '—';
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function EventRow({entry}: {entry: NotificationLogEntry}) {
  const [expanded, setExpanded] = useState(false);
  const isError = entry.result === 'error' || Boolean(entry.error);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => setExpanded(value => !value)}
      style={styles.event}>
      <View style={styles.eventHeader}>
        <Text style={[styles.eventType, isError && styles.errorText]}>
          {isError ? '✕' : '✓'} {entry.eventType}
        </Text>
        <Text style={styles.meta}>{entry.result}</Text>
      </View>
      <Text style={styles.meta}>
        {entry.timestamp} · {entry.appState} · {entry.source}
      </Text>
      {entry.error ? <Text style={styles.errorText}>{entry.error}</Text> : null}
      {expanded ? (
        <Text style={styles.payload}>{formatPayload(entry.payload)}</Text>
      ) : (
        <Text style={styles.hint}>Tap to expand payload</Text>
      )}
    </Pressable>
  );
}

export function NotificationEventLog({entries, onClear}: Props) {
  return (
    <SectionCard title="Notification Event Log" meta={`${entries.length}`}>
      <LabButton label="Clear logs" onPress={onClear} tone="danger" />
      {entries.length === 0 ? (
        <Text style={styles.hint}>No events yet.</Text>
      ) : (
        entries.map(entry => <EventRow key={entry.id} entry={entry} />)
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  event: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eventType: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  payload: {
    ...typography.mono,
    color: colors.info,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
});
