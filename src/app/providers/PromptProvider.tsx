import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { shadows, sizes, spacing } from '../theme/tokens';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Text } from '../../shared/components/Text';
import { getLanguage } from '../../localization/i18n';
import { languageDirection } from '../../localization/types';

type PromptAction = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};
type Prompt = { title: string; message?: string; actions?: PromptAction[] };
type ShowPrompt = (
  title: string,
  message?: string,
  actions?: PromptAction[],
) => void;
const PromptContext = createContext<ShowPrompt | null>(null);

/** One overlay owns app confirmations and menus, including nested confirmations. */
export function PromptProvider({ children }: PropsWithChildren) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const active = useRef<Prompt | null>(null);
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const showPrompt = useCallback<ShowPrompt>((title, message, actions) => {
    const next = { title, message, actions };
    active.current = next;
    setPrompt(next);
  }, []);
  function choose(action?: PromptAction) {
    // Prevent a rapid second tap from repeating a destructive operation.
    if (!prompt || active.current !== prompt) {
      return;
    }
    active.current = null;
    setPrompt(null);
    action?.onPress?.();
  }
  function dismiss() {
    choose(prompt?.actions?.find(action => action.style === 'cancel'));
  }
  const actions = prompt?.actions?.length
    ? prompt.actions
    : [{ text: t('close') }];
  return (
    <PromptContext.Provider value={showPrompt}>
      <View
        style={styles.content}
        accessibilityElementsHidden={prompt !== null}
        importantForAccessibility={prompt ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>
      <Modal
        transparent
        visible={prompt !== null}
        animationType="fade"
        onRequestClose={dismiss}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: colors.scrim,
              direction: languageDirection(getLanguage()),
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          accessibilityViewIsModal
          onAccessibilityEscape={dismiss}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            accessible={false}
            importantForAccessibility="no"
            onPress={dismiss}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Card style={[styles.card, { borderColor: colors.border }]}>
              <Text variant="headlineMd" accessibilityRole="header">
                {prompt?.title}
              </Text>
              {prompt?.message ? (
                <Text tone="muted">{prompt.message}</Text>
              ) : null}
              {actions.map((action, index) => (
                <Button
                  key={`${index}-${action.text}`}
                  title={action.text}
                  variant={
                    action.style === 'destructive'
                      ? 'destructive'
                      : action.style === 'cancel'
                        ? 'secondary'
                        : 'primary'
                  }
                  onPress={() => choose(action)}
                />
              ))}
            </Card>
          </ScrollView>
        </View>
      </Modal>
    </PromptContext.Provider>
  );
}
export function usePrompt(): ShowPrompt {
  const showPrompt = useContext(PromptContext);
  if (!showPrompt) {
    throw new Error('usePrompt must be used within PromptProvider');
  }
  return showPrompt;
}
const styles = StyleSheet.create({
  content: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  scroll: {
    flexGrow: 0,
    width: '100%',
    maxWidth: sizes.contentMax,
    alignSelf: 'center',
  },
  scrollContent: { padding: spacing.xs },
  card: { borderWidth: 1, gap: spacing.lg, ...shadows.transient },
});
