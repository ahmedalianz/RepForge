import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import {
  loadPreferences,
  savePreferences,
} from '../../src/services/storage/preferences';
import i18n, {
  initializeLocalization,
  getLanguage,
  t,
} from '../../src/localization/i18n';
import { resources } from '../../src/localization/resources';
import {
  DEFAULT_LANGUAGE,
  languageDirection,
} from '../../src/localization/types';
import {
  formatNumber,
  formatDate,
  formatPercent,
  unitLabel,
  ltrText,
  normalizeNumericInput,
} from '../../src/localization/format';
import {
  getExerciseName,
  getMuscleName,
} from '../../src/localization/exercises';
import { searchExercises } from '../../src/features/exercises/data/exerciseRepository';
import { createWorkoutRepository } from '../../src/database/repositories/workoutRepository';
import { parseSetInput } from '../../src/features/workouts/domain/setInput';
function canonicalKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string'
      ? [path.replace(/_(zero|one|two|few|many|other)$/, '')]
      : canonicalKeys(child, path);
  });
}
test('new installations default to Egyptian Arabic independently of the system locale', async () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    expect(loadPreferences(db).language).toBe('ar-EG');
    await initializeLocalization();
    expect(DEFAULT_LANGUAGE).toBe('ar-EG');
    expect(getLanguage()).toBe('ar-EG');
    expect(t('home:start')).toBe('ابدأ التمرين');
    expect(languageDirection(getLanguage())).toBe('rtl');
  } finally {
    db.close();
  }
});
test('English selection survives repository reinitialization without altering workout history or kg values', async () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    const repo = createWorkoutRepository(db);
    const session = repo.startSession();
    repo.addExercise(session.id, 'barbell-bench-press');
    const set = repo.listSets(session.id)[0]!;
    repo.saveSet({ ...set, weightKg: 82.5, reps: 6 });
    const before = db.execute('SELECT * FROM workout_sets').rows;
    savePreferences(db, { ...loadPreferences(db), language: 'en-US' });
    migrateDatabase(db);
    await initializeLocalization(loadPreferences(db).language);
    expect(getLanguage()).toBe('en-US');
    expect(languageDirection(getLanguage())).toBe('ltr');
    expect(t('home:start')).toBe('Start Workout');
    expect(db.execute('SELECT * FROM workout_sets').rows).toEqual(before);
    expect(createWorkoutRepository(db).getActiveSession()?.id).toBe(session.id);
  } finally {
    db.close();
  }
});
test('translation namespaces have matching semantic keys including locale-specific plural forms', () => {
  expect(Object.keys(resources['ar-EG']).sort()).toEqual(
    Object.keys(resources['en-US']).sort(),
  );
  expect([...new Set(canonicalKeys(resources['ar-EG']))].sort()).toEqual(
    [...new Set(canonicalKeys(resources['en-US']))].sort(),
  );
});
test('missing Arabic translations fall back to English and unknown keys never reach users', async () => {
  await initializeLocalization('ar-EG');
  const bundle = structuredClone(i18n.getResourceBundle('ar-EG', 'common'));
  try {
    i18n.removeResourceBundle('ar-EG', 'common');
    expect(t('common:save')).toBe('Save');
    // Intentionally inject an invalid key to exercise runtime fallback past TS checks.
    expect(t('common:__missing__' as 'common:save')).not.toContain(
      '__missing__',
    );
  } finally {
    i18n.addResourceBundle('ar-EG', 'common', bundle, true, true);
  }
});
test('Egyptian formatting keeps Western gym digits, localized units and isolated mixed-direction measurements', async () => {
  await initializeLocalization('ar-EG');
  expect(formatNumber(82.5)).toBe('82.5');
  expect(formatPercent(80)).toContain('80');
  expect(unitLabel('kg')).toBe('كجم');
  expect(unitLabel('lb')).toBe('رطل');
  expect(
    formatDate(new Date(2026, 9, 24, 12).getTime(), {
      month: 'long',
      day: 'numeric',
    }),
  ).toContain('أكتوبر');
  expect(formatDate(Date.now())).not.toMatch(/[٠-٩]/);
  expect(ltrText('82.5 كجم × 6 RPE 8')).toBe('\u206682.5 كجم × 6 RPE 8\u2069');
  expect(normalizeNumericInput('٨٢٫٥')).toBe('82.5');
  expect(normalizeNumericInput('۱۲۵')).toBe('125');
  await initializeLocalization('en-US');
  expect(formatNumber(1234.5)).toBe('1,234.5');
  expect(unitLabel('kg')).toBe('kg');
});
test('built-in exercise names and bilingual search localize without changing custom names or canonical records', async () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('custom','My Bench — تمريني','chest','barbell','external')",
    );
    await initializeLocalization('ar-EG');
    expect(getExerciseName('barbell-bench-press', 'Barbell Bench Press')).toBe(
      'بنش بار مستوي',
    );
    expect(getExerciseName('custom', 'My Bench — تمريني')).toBe(
      'My Bench — تمريني',
    );
    expect(getMuscleName('chest')).not.toBe('chest');
    expect(searchExercises(db, 'بنش').map(exercise => exercise.id)).toContain(
      'barbell-bench-press',
    );
    expect(searchExercises(db, 'Bench').map(exercise => exercise.id)).toContain(
      'barbell-bench-press',
    );
    expect(
      searchExercises(db, 'تمريني').map(exercise => exercise.id),
    ).toContain('custom');
    expect(
      db.execute("SELECT name FROM exercises WHERE id = 'barbell-bench-press'")
        .rows[0]?.name,
    ).toBe('Barbell Bench Press');
    await initializeLocalization('en-US');
    expect(getExerciseName('barbell-bench-press', 'Barbell Bench Press')).toBe(
      'Barbell Bench Press',
    );
  } finally {
    db.close();
  }
});
test('Arabic pasted numeric input becomes canonical numeric values and translated validation remains actionable', async () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    const repo = createWorkoutRepository(db);
    const session = repo.startSession();
    repo.addExercise(session.id, 'barbell-bench-press');
    const set = repo.listSets(session.id)[0]!;
    await initializeLocalization('ar-EG');
    const parsed = parseSetInput(
      set,
      { weight: '٨٢٫٥', reps: '٦', rpe: '٨' },
      'kg',
      true,
      true,
    );
    expect(parsed.valid && parsed.set).toMatchObject({
      weightKg: 82.5,
      reps: 6,
      rpe: 8,
    });
    const invalid = parseSetInput(
      set,
      { weight: '-1', reps: '٦', rpe: '٨' },
      'kg',
      true,
      true,
    );
    expect(!invalid.valid && invalid.message).toBe(t('validation:load'));
  } finally {
    db.close();
  }
});

test('native Intl implementations that ignore numberingSystem still produce Western measurements and dates', async () => {
  await initializeLocalization('ar-EG');
  const NativeNumberFormat = Intl.NumberFormat;
  const NativeDateFormat = Intl.DateTimeFormat;
  const numberFormat = jest.spyOn(Intl, 'NumberFormat').mockImplementation(() =>
    Object.defineProperty(new NativeNumberFormat(), 'format', {
      value: () => '١٬٢٣٤٫٥',
    }),
  );
  const dateFormat = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() =>
    Object.defineProperty(new NativeDateFormat(), 'format', {
      value: () => '٢٤ أكتوبر ٢٠٢٦',
    }),
  );
  try {
    expect(formatNumber(1234.5)).toBe('1,234.5');
    expect(formatDate(0)).toBe('24 أكتوبر 2026');
  } finally {
    numberFormat.mockRestore();
    dateFormat.mockRestore();
  }
});
