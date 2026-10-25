import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../app/theme/ThemeProvider';
import { opacity, radii, sizes } from '../../app/theme/tokens';
import { Icon, type IconName } from './Icon';
type Props = Omit<PressableProps, 'children' | 'style'> & {
  icon: IconName;
  label: string;
  mirrorInRTL?: boolean;
  variant?: 'neutral' | 'primary' | 'selected' | 'ghost';
  style?: StyleProp<ViewStyle>;
};
export function IconButton({
  icon,
  label,
  mirrorInRTL,
  variant = 'neutral',
  style,
  disabled,
  accessibilityState,
  accessibilityRole = 'button',
  ...props
}: Props) {
  const { colors } = useTheme();
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'selected'
        ? colors.primaryMuted
        : variant === 'ghost'
          ? 'transparent'
          : colors.surfaceHigh;
  const color =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'selected'
        ? colors.primary
        : colors.muted;
  return (
    <Pressable
      {...props}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor:
            variant === 'selected' ? colors.primaryMuted : colors.border,
        },
        variant === 'ghost' && styles.ghost,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} color={color} mirrorInRTL={mirrorInRTL} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { borderWidth: 0 },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
