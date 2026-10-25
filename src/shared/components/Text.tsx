import { useTranslation } from 'react-i18next';
import { getLanguage } from '../../localization/i18n';
import { getLocalizedTypography } from '../../localization/typography';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';
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
  useTranslation();
  const arabic = getLanguage() === 'ar-EG';
  const color = tone === 'default' ? colors.text : colors[tone];
  return (
    <NativeText
      accessibilityLanguage={getLanguage()}
      {...props}
      style={[
        getLocalizedTypography(variant),
        { color },
        arabic ? styles.arabic : styles.english,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  arabic: { writingDirection: 'rtl', textAlign: 'start' },
  english: { writingDirection: 'ltr', textAlign: 'start' },
});
