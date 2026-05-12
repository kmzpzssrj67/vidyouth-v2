/**
 * Global theme context. One source of truth for colours, spacing, effects,
 * and the user's saved customisations.
 *
 * Usage:
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 *
 *   const { theme, setPreset, setEffects, ... } = useTheme();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  PaletteName,
  ColorOverrides,
  Effects,
  Theme,
  buildTheme,
  defaultEffects,
} from './theme';
import { loadTheme, saveTheme, clearTheme, SavedTheme } from './storage';

interface ThemeContextValue {
  /** Hydration flag — false until AsyncStorage has been read once. */
  ready: boolean;
  /** Current resolved theme (preset + overrides + effects). */
  theme: Theme;
  /** Currently selected preset name. */
  preset: PaletteName;
  /** User colour overrides on top of the preset. */
  overrides: ColorOverrides;
  /** User effect knob values. */
  effects: Effects;

  /** Switch to a preset. Clears any prior overrides. */
  setPreset: (next: PaletteName) => void;
  /** Patch a subset of colour overrides. */
  updateOverrides: (patch: ColorOverrides) => void;
  /** Patch a subset of effect knobs. */
  updateEffects: (patch: Partial<Effects>) => void;
  /** Persist the current state to AsyncStorage. */
  saveCurrent: () => Promise<void>;
  /** Drop overrides + reset effects, fall back to Warm Amber default. */
  resetTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const initialBootstrap: SavedTheme = {
  preset: 'warm-amber',
  overrides: {},
  effects: defaultEffects,
};

interface ProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ProviderProps) {
  const [ready, setReady] = useState(false);
  const [preset, setPresetState] = useState<PaletteName>(initialBootstrap.preset);
  const [overrides, setOverridesState] = useState<ColorOverrides>(
    initialBootstrap.overrides,
  );
  const [effects, setEffectsState] = useState<Effects>(initialBootstrap.effects);

  // hydrate once on mount
  useEffect(() => {
    let alive = true;
    loadTheme().then((saved) => {
      if (!alive) return;
      setPresetState(saved.preset);
      setOverridesState(saved.overrides);
      setEffectsState(saved.effects);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const theme = useMemo<Theme>(
    () => buildTheme(preset, overrides, effects),
    [preset, overrides, effects],
  );

  const persist = useCallback(
    (next: SavedTheme) => {
      saveTheme(next);
    },
    [],
  );

  const setPreset = useCallback(
    (next: PaletteName) => {
      setPresetState(next);
      setOverridesState({}); // switching preset clears prior tweaks
      persist({ preset: next, overrides: {}, effects });
    },
    [effects, persist],
  );

  const updateOverrides = useCallback(
    (patch: ColorOverrides) => {
      setOverridesState((prev) => {
        const next = { ...prev, ...patch };
        persist({ preset, overrides: next, effects });
        return next;
      });
    },
    [preset, effects, persist],
  );

  const updateEffects = useCallback(
    (patch: Partial<Effects>) => {
      setEffectsState((prev) => {
        const next = { ...prev, ...patch };
        persist({ preset, overrides, effects: next });
        return next;
      });
    },
    [preset, overrides, persist],
  );

  const saveCurrent = useCallback(async () => {
    await saveTheme({ preset, overrides, effects });
  }, [preset, overrides, effects]);

  const resetTheme = useCallback(async () => {
    setPresetState('warm-amber');
    setOverridesState({});
    setEffectsState(defaultEffects);
    await clearTheme();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ready,
      theme,
      preset,
      overrides,
      effects,
      setPreset,
      updateOverrides,
      updateEffects,
      saveCurrent,
      resetTheme,
    }),
    [
      ready,
      theme,
      preset,
      overrides,
      effects,
      setPreset,
      updateOverrides,
      updateEffects,
      saveCurrent,
      resetTheme,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be called inside <ThemeProvider>');
  }
  return ctx;
}

/** Shorthand when you only need the resolved theme tokens (most components). */
export function useThemeTokens(): Theme {
  return useTheme().theme;
}
