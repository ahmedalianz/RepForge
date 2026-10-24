import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { opacity, radii, sizes, spacing } from '../../../app/theme/tokens';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { dashboardStyles as layout } from './dashboardStyles';
export function DashboardHeader({
  streak,
  onProfile,
}: {
  streak?: string;
  onProfile: () => void;
}) {
  const { colors } = useTheme();
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
        <View style={layout.row}>
          <View
            style={[styles.brandMark, { backgroundColor: colors.surfaceLow }]}
          >
            <Icon name="forge" color={colors.primary} size={sizes.smallIcon} />
          </View>
          <Text variant="headlineSm" style={layout.uppercase}>
            RepForge
          </Text>
        </View>
        <View style={styles.trailing}>
          {streak ? (
            <View
              style={[
                layout.badge,
                styles.streak,
                { backgroundColor: colors.surfaceHigh },
              ]}
              accessibilityLabel={`${streak} training streak`}
            >
              <Icon name="fire" color={colors.primary} size={sizes.badgeIcon} />
              <Text variant="labelSm" style={{ color: colors.primary }}>
                {streak}
              </Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
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
