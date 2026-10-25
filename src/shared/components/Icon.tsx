import { useTranslation } from 'react-i18next';
import { getLanguage } from '../../localization/i18n';
import Svg, { Path } from 'react-native-svg';
import { sizes } from '../../app/theme/tokens';
const paths = {
  arrowLeft: 'M19 12H5m6-6-6 6 6 6',
  chevronDown: 'm6 9 6 6 6-6',
  more: 'M12 4h.01M12 12h.01M12 20h.01',
  skip: 'm5 5 10 7-10 7ZM19 5v14',
  tune: 'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6M10 15v6',
  circle: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  addCircle: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v10M7 12h10',
  close: 'm6 6 12 12M6 18 18 6',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',

  forge:
    'M12 3 20 7.5v9L12 21 4 16.5v-9ZM8 8v8m8-8v8M8 12h8M12 1v4m0 14v4M1 12h4m14 0h4',
  fire: 'M12 3c1 5-4 5-3 9 1-2 3-2 3-4 4 3 7 5 6 9a6 6 0 0 1-12-1C5 11 8 7 12 3Z',
  dumbbell: 'M6 4v16M3 8v8M18 4v16M21 8v8M6 12h12',
  trend: 'M3 17l6-6 4 4 8-10M15 5h6v6',
  chart: 'M4 20V10m8 10V4m8 16v-8',
  user: 'M20 21v-2a8 8 0 0 0-16 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  add: 'M12 5v14M5 12h14',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  play: 'm8 5 11 7-11 7Z',
  calendar: 'M4 5h16v16H4ZM8 3v4m8-4v4M4 10h16',
  trophy:
    'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8',
  check: 'm5 12 4 4L19 6',
  checkCircle: 'M21 12a9 9 0 1 1-5-8M8 11l4 4 9-10',
  timer:
    'M9 2h6m-3 3v2m6-1 2 2M12 10v5l3 2M20 15a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  moon: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  color,
  size = sizes.icon,
  mirrorInRTL = true,
}: {
  name: IconName;
  color: string;
  size?: number;
  mirrorInRTL?: boolean;
}) {
  useTranslation();
  const mirrored =
    mirrorInRTL &&
    getLanguage() === 'ar-EG' &&
    (name === 'arrowLeft' || name === 'arrowRight' || name === 'skip');
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={paths[name]}
        fill={name === 'play' ? color : 'none'}
        stroke={color}
        transform={name === 'dumbbell' ? 'rotate(-45 12 12)' : undefined}
        strokeWidth={name === 'add' ? 2.6 : name === 'check' ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
