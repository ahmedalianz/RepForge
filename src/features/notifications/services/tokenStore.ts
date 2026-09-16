import AsyncStorage from '@react-native-async-storage/async-storage';
import {TOKEN_STORAGE_KEY} from '../config/constants';
import type {PushTokenRecord} from '../types';

export async function loadStoredToken(): Promise<PushTokenRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PushTokenRecord;
    if (!parsed?.token || !parsed?.kind) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStoredToken(
  record: PushTokenRecord,
): Promise<PushTokenRecord> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}
