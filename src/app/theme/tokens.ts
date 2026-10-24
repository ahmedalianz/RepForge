import type { TextStyle } from 'react-native';
import { kineticObsidian as palette } from './palette';
export const spacing = {
  micro: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  marginMd: 20,
} as const;
export const radii = {
  sm: 4,
  md: 8,
  control: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
export const sizes = {
  touchTarget: 48,
  button: 56,
  icon: 24,
  smallIcon: 18,
  badgeIcon: 14,
  actionIcon: 28,
  trailingIcon: 20,
  day: 36,
  avatar: 32,
  header: 64,
  tabBar: 80,
  chart: 40,
  chartMinimum: 4,
  contentMax: 600,
} as const;
export const opacity = {
  disabled: 0.45,
  pressed: 0.9,
  inactive: 0.4,
  completed: 0.7,
} as const;
const fonts = {
  regular: 'PlusJakartaSans-Regular',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
} as const;
const textStyles = {
  displayHero: {
    fontFamily: fonts.extraBold,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.68,
  },
  displayHeroMobile: {
    fontFamily: fonts.extraBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
  },
  headlineLg: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
  },
  headlineLgMobile: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.39,
  },
  headlineMd: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  headlineSm: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  metricLg: {
    fontFamily: fonts.extraBold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.44,
    fontVariant: ['tabular-nums'],
  },
  metricMd: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.64,
    fontVariant: ['tabular-nums'],
  },
  metricSm: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  captionSm: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  labelMd: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
  },
  labelSm: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
  },
} satisfies Record<string, TextStyle>;
export const typography = {
  ...textStyles,
  title: textStyles.headlineLgMobile,
  heading: textStyles.headlineSm,
  body: textStyles.bodyMd,
  caption: textStyles.labelMd,
};
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceLow: string;
  surfaceHigh: string;
  surfaceHighest: string;
  surfaceLowest: string;
  primary: string;
  primaryMuted: string;
  secondary: string;
  text: string;
  muted: string;
  subtle: string;
  scrim: string;
  border: string;
  onPrimary: string;
  danger: string;
  milestone: string;
  milestoneMuted: string;
  onMilestone: string;
};
// The HTML uses primary-fixed for actions, while Material's literal primary is white.
export const darkColors: ThemeColors = {
  background: palette.background,
  surface: palette.surfaceContainer,
  surfaceLow: palette.surfaceContainerLow,
  surfaceHigh: palette.surfaceContainerHigh,
  surfaceHighest: palette.surfaceContainerHighest,
  surfaceLowest: palette.surfaceContainerLowest,
  primary: palette.primaryFixed,
  primaryMuted: '#c6f26a26',
  secondary: palette.secondary,
  text: palette.onSurface,
  muted: palette.onSurfaceVariant,
  subtle: palette.outline,
  scrim: '#00000099',
  border: palette.outlineVariant,
  onPrimary: palette.onPrimary,
  danger: palette.error,
  milestone: palette.tertiaryFixed,
  milestoneMuted: '#ffdf9b26',
  onMilestone: palette.onTertiaryContainer,
};
export const lightColors: ThemeColors = {
  background: '#f5f7ef',
  surface: '#ffffff',
  surfaceLow: '#eef0e7',
  surfaceHigh: '#e4e7dc',
  surfaceHighest: '#d7dccd',
  surfaceLowest: '#f8faF4',
  primary: '#4b6700',
  primaryMuted: '#4b67001a',
  secondary: '#0252ad',
  text: '#181c15',
  muted: '#555d48',
  subtle: '#66725b',
  scrim: '#00000099',
  border: '#c4c9b3',
  onPrimary: '#ffffff',
  danger: '#93000a',
  milestone: '#7f6000',
  milestoneMuted: '#ffdf9b66',
  onMilestone: '#ffffff',
};
// Static cards use tonal stacking. The reference reserves a subtle glow for primary actions.
export const shadows = {
  action: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  transient: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
