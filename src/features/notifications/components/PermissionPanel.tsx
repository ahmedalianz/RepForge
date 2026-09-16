import React from 'react';
import {Text} from 'react-native';
import {SectionCard} from '../../../components/SectionCard';
import {StatusRow} from '../../../components/StatusRow';
import {colors, typography} from '../../../theme';
import type {NotificationPermissionStatus} from '../types';
import {ButtonRow, LabButton} from './LabButton';

type Props = {
  status: NotificationPermissionStatus;
  busy?: boolean;
  onCheck: () => void;
  onRequest: () => void;
  onOpenSettings: () => void;
};

export function PermissionPanel({
  status,
  busy,
  onCheck,
  onRequest,
  onOpenSettings,
}: Props) {
  return (
    <SectionCard title="Notification Permission" meta={status}>
      <StatusRow label="Status" value={status} />
      <Text style={{...typography.caption, color: colors.text.muted}}>
        Android 13+ requires POST_NOTIFICATIONS. iOS may return PROVISIONAL if
        requested. Denied ≠ always Blocked — use Open Settings after permanent
        deny.
      </Text>
      <ButtonRow>
        <LabButton label="Check Permission" onPress={onCheck} disabled={busy} />
        <LabButton
          label="Request Permission"
          onPress={onRequest}
          disabled={busy}
          tone="accent"
        />
        <LabButton
          label="Open Notification Settings"
          onPress={onOpenSettings}
          disabled={busy}
        />
      </ButtonRow>
    </SectionCard>
  );
}
