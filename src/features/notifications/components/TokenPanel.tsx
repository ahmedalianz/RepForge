import React from 'react';
import {Text} from 'react-native';
import {SectionCard} from '../../../components/SectionCard';
import {StatusRow} from '../../../components/StatusRow';
import {colors, typography} from '../../../theme';
import type {PushTokenRecord} from '../types';
import {ButtonRow, LabButton} from './LabButton';

type Props = {
  token: PushTokenRecord | null;
  tokenStatus: string;
  remoteTransport: string;
  busy?: boolean;
  onGet: () => void;
  onRefresh: () => void;
  onClear: () => void;
};

function describeKind(token: PushTokenRecord | null): string {
  if (!token) {
    return '—';
  }
  switch (token.kind) {
    case 'fcm':
      return 'FCM registration token';
    case 'apns':
      return 'APNs device token';
    case 'simulated-fcm':
      return 'SIMULATED FCM registration token';
    case 'simulated-apns':
      return 'SIMULATED APNs device token';
    default:
      return token.kind;
  }
}

export function TokenPanel({
  token,
  tokenStatus,
  remoteTransport,
  busy,
  onGet,
  onRefresh,
  onClear,
}: Props) {
  return (
    <SectionCard title="Push Token" meta={tokenStatus}>
      <StatusRow label="Transport" value={remoteTransport} />
      <StatusRow label="Kind" value={describeKind(token)} />
      <StatusRow label="Token status" value={tokenStatus} />
      <StatusRow
        label="Current token"
        value={token?.token ?? 'none'}
      />
      <StatusRow
        label="Last updated"
        value={token?.updatedAt ?? '—'}
      />
      <Text style={{...typography.caption, color: colors.text.muted}}>
        APNs device token ≠ FCM registration token. On Android, FCM usually wraps
        APNs only on iOS via Firebase. This lab does not treat them as the same.
      </Text>
      <ButtonRow>
        <LabButton label="Get Token" onPress={onGet} disabled={busy} />
        <LabButton label="Refresh Token" onPress={onRefresh} disabled={busy} />
        <LabButton
          label="Clear Stored Token"
          onPress={onClear}
          disabled={busy}
          tone="danger"
        />
      </ButtonRow>
    </SectionCard>
  );
}
