import { Text as NativeText, type TextProps } from 'react-native';
import { useTheme } from '../../app/theme/ThemeProvider';
import { typography } from '../../app/theme/tokens';
type Props = TextProps & {
  variant?: keyof typeof typography;
  tone?: 'default' | 'muted' | 'danger';
};
export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: Props) {
  const { colors } = useTheme();
  const color = tone === 'default' ? colors.text : colors[tone];
  return (
    <NativeText {...props} style={[typography[variant], { color }, style]} />
  );
}
