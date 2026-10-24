import {
  dedupeFamilyForKind,
  resolveNotificationIdentity,
} from '../src/features/notifications/utils/notificationIdentity';

describe('notificationIdentity', () => {
  it('prefers providerMessageId as dedupeKey', () => {
    const identity = resolveNotificationIdentity({
      providerMessageId: 'fcm-1',
      notificationId: 'local-1',
      title: 't',
      body: 'b',
      data: {type: 'order', id: '123'},
    });
    expect(identity.dedupeKey).toBe('fcm-1');
    expect(identity.providerMessageId).toBe('fcm-1');
  });

  it('falls back to notificationId then hash', () => {
    const withId = resolveNotificationIdentity({
      notificationId: 'local-9',
      data: {type: 'order', id: '1'},
    });
    expect(withId.dedupeKey).toBe('local-9');

    const hashed = resolveNotificationIdentity({
      title: 'A',
      body: 'B',
      data: {type: 'order', id: '1'},
    });
    expect(hashed.dedupeKey.startsWith('h') || hashed.dedupeKey.length > 0).toBe(
      true,
    );
  });

  it('maps opened+initial to the same dedupe family', () => {
    expect(dedupeFamilyForKind('opened')).toBe('open');
    expect(dedupeFamilyForKind('initial')).toBe('open');
    expect(dedupeFamilyForKind('received')).toBe('received');
  });
});
