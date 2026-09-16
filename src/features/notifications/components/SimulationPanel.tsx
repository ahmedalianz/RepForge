import React from 'react';
import {Text} from 'react-native';
import {SectionCard} from '../../../components/SectionCard';
import {colors, typography} from '../../../theme';
import {ButtonRow, LabButton} from './LabButton';

type Props = {
  busy?: boolean;
  onForeground: () => void;
  onTap: () => void;
  onInitial: () => void;
  onDuplicate: () => void;
  onInvalid: () => void;
  onTokenRefresh: () => void;
};

export function SimulationPanel({
  busy,
  onForeground,
  onTap,
  onInitial,
  onDuplicate,
  onInvalid,
  onTokenRefresh,
}: Props) {
  return (
    <SectionCard title="Simulation" meta="dev lab">
      <Text style={{...typography.caption, color: colors.text.muted}}>
        All simulations enter NotificationService (validate → dedupe → pending →
        log). They are not UI-only fakes.
      </Text>
      <ButtonRow>
        <LabButton
          label="Simulate Foreground Notification"
          onPress={onForeground}
          disabled={busy}
          tone="accent"
        />
        <LabButton
          label="Simulate Notification Tap"
          onPress={onTap}
          disabled={busy}
        />
        <LabButton
          label="Simulate Initial Notification"
          onPress={onInitial}
          disabled={busy}
        />
        <LabButton
          label="Simulate Duplicate Notification"
          onPress={onDuplicate}
          disabled={busy}
        />
        <LabButton
          label="Simulate Invalid Payload"
          onPress={onInvalid}
          disabled={busy}
        />
        <LabButton
          label="Simulate Token Refresh"
          onPress={onTokenRefresh}
          disabled={busy}
        />
      </ButtonRow>
    </SectionCard>
  );
}
