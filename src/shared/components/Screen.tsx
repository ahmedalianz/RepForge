import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../app/theme/ThemeProvider';
import { sizes, spacing } from '../../app/theme/tokens';
/** Navigation owns top/bottom insets; this container protects landscape content. */
export function Screen({
  children,
  contentStyle,
}: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingLeft: spacing.lg + insets.left,
            paddingRight: spacing.lg + insets.right,
          },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
    maxWidth: sizes.contentMax,
    alignSelf: 'center',
  },
});
