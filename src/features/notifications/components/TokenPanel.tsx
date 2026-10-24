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
  firebaseConfigured: boolean;
  fcmAvailable: boolean;
  apnsDeviceToken?: string;
  lastError?: string;
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
  firebaseConfigured,
  fcmAvailable,
  apnsDeviceToken,
  lastError,
  busy,
  onGet,
  onRefresh,
  onClear,
}: Props) {
  return (
    <SectionCard title="Push Token" meta={tokenStatus}>
      <StatusRow label="Provider" value="FCM" />
      <StatusRow
        label="Firebase"
        value={firebaseConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
      />
      <StatusRow
        label="FCM"
        value={fcmAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
      />
      <StatusRow label="Transport" value={remoteTransport} />
      <StatusRow label="Token kind" value={describeKind(token)} />
      <StatusRow label="Token status" value={tokenStatus} />
      <StatusRow label="Source" value={token?.source ?? '—'} />
      <StatusRow label="Current token" value={token?.token ?? 'none'} />
      <StatusRow label="Last updated" value={token?.updatedAt ?? '—'} />
      <StatusRow
        label="APNs device token"
        value={apnsDeviceToken ?? token?.apnsDeviceToken ?? 'n/a (iOS only)'}
      />
      {lastError ? (
        <StatusRow label="Last error" value={lastError} />
      ) : null}
      <Text style={{...typography.caption, color: colors.text.muted}}>
        With Firebase, both Android and iOS apps primarily use the FCM
        registration token. On iOS, APNs device token is a separate underlying
        value — never mix them up or send the wrong one to your backend.
        Request Permission before Get Token. Simulator often cannot mint a real
        APNs/FCM token — use a physical device if Get Token keeps failing.
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
