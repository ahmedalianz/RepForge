import { Icon, type IconName } from '../../shared/components/Icon';
import type { TabParamList } from './types';
const icons: Record<keyof TabParamList, IconName> = {
  Home: 'fire',
  Workouts: 'dumbbell',
  Progress: 'chart',
  Profile: 'user',
};
export function TabIcon({
  name,
  color,
}: {
  name: keyof TabParamList;
  color: string;
}) {
  return <Icon name={icons[name]} color={color} />;
}
