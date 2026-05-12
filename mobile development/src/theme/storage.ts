/**
 * AsyncStorage wrapper for theme persistence. Versioned key so we can
 * migrate the saved shape later without crashing on stale data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorOverrides, Effects, defaultEffects } from './theme';
import { PaletteName } from './presets';

const KEY = 'vidyouth.theme.v1';

export interface SavedTheme {
  preset: PaletteName;
  overrides: ColorOverrides;
  effects: Effects;
}

const fallback: SavedTheme = {
  preset: 'warm-amber',
  overrides: {},
  effects: defaultEffects,
};

export async function loadTheme(): Promise<SavedTheme> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SavedTheme>;
    return {
      preset: parsed.preset ?? fallback.preset,
      overrides: parsed.overrides ?? {},
      effects: { ...fallback.effects, ...(parsed.effects ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export async function saveTheme(t: SavedTheme): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // best-effort; silent fail keeps app working in private/incognito-style storage
  }
}

export async function clearTheme(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
