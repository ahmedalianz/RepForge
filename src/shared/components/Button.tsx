import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../app/theme/ThemeProvider';
import {
  opacity,
  radii,
  shadows,
  sizes,
  spacing,
} from '../../app/theme/tokens';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  selected?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  size?: 'regular' | 'compact';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};
export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  selected,
  leadingIcon,
  trailingIcon,
  size = 'regular',
  style,
  labelStyle,
}: Props) {
  const { colors } = useTheme();
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surfaceHigh
        : 'transparent';
  const color =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'destructive'
        ? colors.danger
        : colors.text;
  const borderColor = selected
    ? colors.primary
    : variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
        ? colors.danger
        : colors.border;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          minHeight:
            variant === 'primary' && size === 'regular'
              ? sizes.button
              : sizes.touchTarget,
        },
        variant === 'primary' && {
          ...shadows.action,
          shadowColor: colors.primary,
        },
        size === 'compact' && styles.compact,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.label, trailingIcon && styles.labelWithTrailing]}>
        {leadingIcon ? <Icon name={leadingIcon} color={color} /> : null}
        <Text
          variant={variant === 'primary' ? 'buttonLabel' : 'bodyBold'}
          style={[
            { color },
            variant === 'primary' && styles.uppercase,
            labelStyle,
          ]}
        >
          {title}
        </Text>
      </View>
      {trailingIcon ? (
        <Icon name={trailingIcon} color={color} size={sizes.trailingIcon} />
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  compact: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  labelWithTrailing: { flex: 1, justifyContent: 'flex-start' },
  uppercase: { textTransform: 'uppercase' },
  pressed: { opacity: opacity.pressed, transform: [{ scale: 0.98 }] },
  disabled: { opacity: opacity.disabled },
});
