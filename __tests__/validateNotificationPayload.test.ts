import {
  buildAppNotification,
  validateNotificationPayload,
} from '../src/features/notifications/utils/validatePayload';

describe('validateNotificationPayload', () => {
  it('accepts a valid order payload', () => {
    const result = validateNotificationPayload(
      buildAppNotification({
        id: '123',
        title: 'Order #123',
        body: 'Shipped',
        data: {type: 'order', id: '123', route: 'OrderDetails'},
      }),
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.type).toBe('order');
      expect(result.id).toBe('123');
      expect(result.route).toBe('OrderDetails');
    }
  });

  it('rejects missing type', () => {
    const result = validateNotificationPayload(
      buildAppNotification({
        id: '1',
        data: {id: '1'},
      }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/type/i);
    }
  });

  it('rejects missing id', () => {
    const result = validateNotificationPayload({
      id: '',
      data: {type: 'order'},
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/id/i);
    }
  });

  it('rejects unknown sentinel types', () => {
    const result = validateNotificationPayload(
      buildAppNotification({
        id: 'x',
        data: {type: 'unknown', id: 'x'},
      }),
    );
    expect(result.valid).toBe(false);
  });

  it('does not throw on null', () => {
    expect(() => validateNotificationPayload(null)).not.toThrow();
    expect(validateNotificationPayload(null).valid).toBe(false);
  });
});
