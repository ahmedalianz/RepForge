import type {AppNotification, NotificationLifecycleKind} from '../types';

export type PendingNotification = {
  notification: AppNotification;
  kind: NotificationLifecycleKind;
  queuedAt: string;
};

/**
 * Holds cold-start / early notifications until navigation (and the app shell)
 * are ready. Phase 2 only logs navigation intent — no real navigation yet.
 */
export class PendingNotificationQueue {
  private pending: PendingNotification | null = null;

  enqueue(item: PendingNotification): void {
    // Newest wins — typical production choice for cold-start open events.
    this.pending = item;
  }

  peek(): PendingNotification | null {
    return this.pending;
  }

  drain(): PendingNotification | null {
    const next = this.pending;
    this.pending = null;
    return next;
  }

  size(): number {
    return this.pending ? 1 : 0;
  }

  clear(): void {
    this.pending = null;
  }
}
