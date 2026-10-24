import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { opacity, radii, shadows, sizes, spacing } from '../theme/tokens';
import { Text } from '../../shared/components/Text';
import { Icon } from '../../shared/components/Icon';
import { TabIcon } from './TabIcon';
import type { RootStackParamList, TabParamList } from './types';
export function TrainingTabBar({
  state,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceLow,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const color = selected ? colors.primary : colors.muted;
          const name = route.name as keyof TabParamList;
          return (
            <Fragment key={route.key}>
              {index === 2 ? (
                <View style={styles.actionSlot}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Quick start workout"
                    onPress={() =>
                      navigation
                        .getParent<
                          NativeStackNavigationProp<RootStackParamList>
                        >()
                        ?.navigate('StartWorkout')
                    }
                    style={({ pressed }) => [
                      styles.action,
                      {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                      },
                      shadows.action,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Icon
                      name="add"
                      color={colors.onPrimary}
                      size={sizes.actionIcon}
                    />
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={name}
                accessibilityState={{ selected }}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!selected && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                onLongPress={() =>
                  navigation.emit({ type: 'tabLongPress', target: route.key })
                }
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              >
                <TabIcon name={name} color={color} />
                <Text variant="labelSm" style={{ color }}>
                  {name}
                </Text>
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    minHeight: sizes.tabBar,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  actionSlot: { flex: 1, alignItems: 'center' },
  action: {
    height: sizes.button,
    width: sizes.button,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -spacing.lg }],
  },
  pressed: { opacity: opacity.pressed },
});

// Navigation calls tabBar as a renderer; mount a component so its hooks have a React boundary.
export function renderTrainingTabBar(props: BottomTabBarProps) {
  return <TrainingTabBar {...props} />;
}
