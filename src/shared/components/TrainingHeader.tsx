import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../app/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';
export function TrainingHeader({
  streak,
  onProfile,
}: {
  streak?: string;
  onProfile: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={[
          styles.content,
          {
            paddingLeft: spacing.lg + insets.left,
            paddingRight: spacing.lg + insets.right,
          },
        ]}
      >
        <View style={styles.row}>
          <View
            style={[styles.brandMark, { backgroundColor: colors.surfaceLow }]}
          >
            <Icon name="forge" color={colors.primary} size={sizes.smallIcon} />
          </View>
          <Text variant="headlineSm" style={styles.uppercase}>
            RepForge
          </Text>
        </View>
        <View style={styles.trailing}>
          {streak ? (
            <View
              style={[
                styles.badge,
                styles.streak,
                { backgroundColor: colors.surfaceHigh },
              ]}
              accessibilityLabel={t('streak', { streak })}
            >
              <Icon name="fire" color={colors.primary} size={sizes.badgeIcon} />
              <Text variant="labelSm" style={{ color: colors.primary }}>
                {streak}
              </Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('openProfile')}
            onPress={onProfile}
            style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
          >
            <View
              style={[styles.avatar, { backgroundColor: colors.surfaceHigh }]}
            >
              <Icon name="user" color={colors.muted} size={sizes.smallIcon} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  uppercase: { textTransform: 'uppercase' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  content: {
    height: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  streak: { borderRadius: radii.full },
  profile: {
    height: sizes.touchTarget,
    width: sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandMark: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    height: sizes.avatar,
    width: sizes.avatar,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: opacity.pressed },
});
