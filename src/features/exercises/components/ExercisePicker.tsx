import { getLocalizedTypography } from '../../../localization/typography';
import { useTranslation } from 'react-i18next';
import {
  getExerciseName,
  getMuscleName,
  getEquipmentName,
  getExerciseTypeName,
} from '../../../localization/exercises';
import { t } from '../../../localization/i18n';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import {
  opacity,
  radii,
  sizes,
  spacing,
  typography,
} from '../../../app/theme/tokens';
import { IconButton } from '../../../shared/components/IconButton';
import { Icon } from '../../../shared/components/Icon';
import { Text } from '../../../shared/components/Text';
import { Button } from '../../../shared/components/Button';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
export function ExercisePicker({
  visible,
  mode = 'add',
  selectedIds,
  error,
  onSelect,
  onClose,
}: {
  visible: boolean;
  mode?: 'add' | 'select';
  selectedIds: readonly string[];
  error?: string;
  onSelect: (id: string) => boolean;
  onClose: () => void;
}) {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const catalog = useExerciseCatalog(visible);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.scrim,
            paddingTop: insets.top + spacing.lg,
          },
        ]}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={styles.header}>
            <Text variant="headlineMd">
              {mode === 'add' ? t('exercises:add') : t('exercises:choose')}
            </Text>
            <IconButton
              icon="close"
              label={t('exercises:closePicker')}
              onPress={onClose}
            />
          </View>
          <TextInput
            accessibilityLabel={t('exercises:search')}
            placeholder={t('exercises:searchPlaceholder')}
            placeholderTextColor={colors.subtle}
            value={catalog.query}
            onChangeText={catalog.setQuery}
            autoCorrect={false}
            style={[
              styles.search,
              getLocalizedTypography('body'),
              i18n.language === 'ar-EG'
                ? styles.arabicSearch
                : styles.englishSearch,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
          {error || catalog.error ? (
            <View style={styles.error}>
              <Text tone="danger" accessibilityRole="alert">
                {error ?? catalog.error}
              </Text>
              {catalog.error ? (
                <Button
                  title={t('common:retry')}
                  variant="secondary"
                  onPress={catalog.refresh}
                />
              ) : null}
            </View>
          ) : null}
          <FlatList
            data={catalog.exercises}
            keyExtractor={exercise => exercise.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text tone="muted" style={styles.empty}>
                {t('exercises:empty')}
              </Text>
            }
            renderItem={({ item: exercise }) => {
              const added = selectedIds.includes(exercise.id);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    mode === 'add'
                      ? 'exercises:addName'
                      : 'exercises:selectName',
                    { name: getExerciseName(exercise.id, exercise.name) },
                  )}
                  accessibilityState={{
                    disabled: mode === 'add' && added,
                    selected: mode === 'select' && added,
                  }}
                  disabled={mode === 'add' && added}
                  onPress={() => {
                    if (onSelect(exercise.id)) {
                      onClose();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.exercise,
                    { borderBottomColor: colors.border },
                    pressed && styles.pressed,
                    mode === 'add' && added && styles.added,
                  ]}
                >
                  <Icon name="dumbbell" color={colors.primary} />
                  <View style={styles.exerciseName}>
                    <Text variant="bodyBold">
                      {getExerciseName(exercise.id, exercise.name)}
                    </Text>
                    <Text variant="caption">
                      {getMuscleName(exercise.primaryMuscleGroup)} •{' '}
                      {getEquipmentName(exercise.equipment)} •{' '}
                      {getExerciseTypeName(exercise.exerciseType)}
                    </Text>
                  </View>
                  <Icon
                    name={added ? 'check' : 'add'}
                    color={added ? colors.subtle : colors.primary}
                  />
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    flex: 1,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  arabicSearch: { textAlign: 'start', writingDirection: 'rtl' },
  englishSearch: { textAlign: 'start', writingDirection: 'ltr' },
  search: {
    ...typography.body,
    minHeight: sizes.touchTarget,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  exercise: {
    minHeight: sizes.touchTarget + spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exerciseName: { flex: 1, gap: spacing.xs },
  pressed: { opacity: opacity.pressed },
  added: { opacity: opacity.disabled },
  empty: { paddingVertical: spacing.xl },
  error: { gap: spacing.sm, paddingVertical: spacing.md },
});
