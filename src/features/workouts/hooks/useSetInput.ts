import { normalizeNumericInput } from '../../../localization/format';
import { useTranslation } from 'react-i18next';
import { t } from '../../../localization/i18n';
import { useState } from 'react';
import type { WeightUnit } from '../domain/strength';
import type { WorkoutSet } from '../domain/types';
import {
  getSetInput,
  parseSetInput,
  type SetInput,
  type SetInputField,
} from '../domain/setInput';
type Draft = { key: string; input: SetInput; weightEdited: boolean };
export function useSetInput(
  set: WorkoutSet | undefined,
  unit: WeightUnit,
  save: (set: WorkoutSet) => boolean,
  reportError: (message: string) => void,
) {
  useTranslation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const key = `${set?.id ?? ''}:${unit}`;
  const current =
    draft?.key === key
      ? draft
      : {
          key,
          input: set
            ? getSetInput(set, unit)
            : { weight: '', reps: '', rpe: '' },
          weightEdited: false,
        };
  function change(field: SetInputField, text: string): void {
    text = normalizeNumericInput(text).replace(',', '.');
    if (!set) {
      return;
    }
    const updated = {
      ...current,
      input: { ...current.input, [field]: text },
      weightEdited: current.weightEdited || field === 'weight',
    };
    setDraft(updated);
    const result = parseSetInput(
      set,
      updated.input,
      unit,
      false,
      updated.weightEdited,
    );
    // Partial decimal text stays local; valid edits are checkpointed immediately.
    if (result.valid) {
      save(result.set);
    }
  }
  function parse(complete: boolean): WorkoutSet | null {
    if (!set) {
      return null;
    }
    const result = parseSetInput(
      set,
      current.input,
      unit,
      complete,
      current.weightEdited,
    );
    if (!result.valid) {
      reportError(result.message);
      return null;
    }
    return result.set;
  }
  function step(delta: number): void {
    const parsed = parse(false);
    if (!parsed) {
      return;
    }
    const value = Number(current.input.weight.replace(',', '.'));
    if (!Number.isFinite(value)) {
      reportError(t('workouts:stepLoad'));
      return;
    }
    change(
      'weight',
      String(Math.max(0, Math.round((value + delta) * 100) / 100)),
    );
  }
  return { input: current.input, change, parse, step };
}
