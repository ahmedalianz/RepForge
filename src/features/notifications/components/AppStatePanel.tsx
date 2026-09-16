import React from 'react';
import {SectionCard} from '../../../components/SectionCard';
import {StatusRow} from '../../../components/StatusRow';
import type {PlaygroundAppState} from '../types';

type Props = {
  appState: PlaygroundAppState;
  lastChangeAt: string | null;
  pendingCount: number;
};

export function AppStatePanel({appState, lastChangeAt, pendingCount}: Props) {
  return (
    <SectionCard title="App State" meta={appState}>
      <StatusRow label="Current app state" value={appState} />
      <StatusRow label="Last state change" value={lastChangeAt ?? '—'} />
      <StatusRow label="Pending notifications" value={String(pendingCount)} />
    </SectionCard>
  );
}
