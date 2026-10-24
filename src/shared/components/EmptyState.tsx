import type { PropsWithChildren } from 'react';
import { Card } from './Card';
import { Text } from './Text';
export function EmptyState({
  title,
  message,
  children,
}: PropsWithChildren<{ title: string; message: string }>) {
  return (
    <Card title={title}>
      <Text tone="muted">{message}</Text>
      {children}
    </Card>
  );
}
