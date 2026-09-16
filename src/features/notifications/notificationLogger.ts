import {logEvent} from '../../services/logging';
import {getCurrentPlaygroundAppState} from './utils/appState';
import type {
  NotificationEventSource,
  NotificationEventType,
  PlaygroundAppState,
} from './types';

export type NotificationLogEntry = {
  id: string;
  timestamp: string;
  eventType: NotificationEventType;
  appState: PlaygroundAppState;
  payload?: unknown;
  source: NotificationEventSource;
  result: 'ok' | 'queued' | 'ignored' | 'error' | 'pending' | string;
  error?: string;
};

type Listener = (entries: NotificationLogEntry[]) => void;

const MAX_ENTRIES = 200;
const entries: NotificationLogEntry[] = [];
const listeners = new Set<Listener>();
let sequence = 0;

function notify(): void {
  const snapshot = [...entries];
  listeners.forEach(listener => listener(snapshot));
}

export function logNotificationEvent(input: {
  eventType: NotificationEventType;
  payload?: unknown;
  source?: NotificationEventSource;
  result?: NotificationLogEntry['result'];
  error?: string;
  appState?: PlaygroundAppState;
}): NotificationLogEntry {
  sequence += 1;
  const entry: NotificationLogEntry = {
    id: `notif-${Date.now()}-${sequence}`,
    timestamp: new Date().toISOString(),
    eventType: input.eventType,
    appState: input.appState ?? getCurrentPlaygroundAppState(),
    payload: input.payload,
    source: input.source ?? 'service',
    result: input.result ?? (input.error ? 'error' : 'ok'),
    error: input.error,
  };

  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  logEvent({
    module: 'notifications',
    event: entry.eventType,
    payload: entry.payload,
    appState: entry.appState,
    result: entry.result,
    error: entry.error,
  });

  notify();
  return entry;
}

export function getNotificationLogEntries(): NotificationLogEntry[] {
  return [...entries];
}

export function clearNotificationLogs(): void {
  entries.length = 0;
  notify();
}

export function subscribeToNotificationLogs(listener: Listener): () => void {
  listeners.add(listener);
  listener([...entries]);
  return () => {
    listeners.delete(listener);
  };
}

export function getLatestNotificationLog(): NotificationLogEntry | undefined {
  return entries[0];
}
