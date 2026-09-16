import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Screen} from '../../../components/Screen';
import {SectionCard} from '../../../components/SectionCard';
import {APP_CONFIG} from '../../../config/app';
import type {RootStackParamList} from '../../../navigation/types';
import {colors, spacing, typography} from '../../../theme';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const SECTIONS: Array<{
  title: string;
  description: string;
  route: keyof RootStackParamList;
  meta: string;
}> = [
  {
    title: 'Push Notifications',
    description:
      'Permissions, token lifecycle, foreground/background/killed delivery, and navigation from payload data.',
    route: 'Notifications',
    meta: 'Ready',
  },
  {
    title: 'Deep Linking',
    description:
      'Custom schemes, App Links / Universal Links, cold-start races, auth gates, and a shared resolver.',
    route: 'DeepLinking',
    meta: 'Phase 3',
  },
  {
    title: 'SSL Pinning',
    description:
      'Native TLS certificate / public-key pinning on Android and iOS — not a JS-only fake.',
    route: 'SslPinning',
    meta: 'Phase 4',
  },
  {
    title: 'Debug / Diagnostics',
    description:
      'Runtime snapshot, navigation readiness, and structured event logs from every module.',
    route: 'Diagnostics',
    meta: 'Ready',
  },
];

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();

  return (
    <Screen>
      <Text style={styles.kicker}>{APP_CONFIG.displayName}</Text>
      <Text style={styles.title}>Failure laboratory</Text>
      <Text style={styles.subtitle}>
        Isolated playgrounds for real production edge cases. Start with
        Diagnostics, then implement each feature incrementally.
      </Text>

      {SECTIONS.map(section => (
        <SectionCard
          key={section.route}
          title={section.title}
          description={section.description}
          meta={section.meta}
          onPress={() => navigation.navigate(section.route)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
});
