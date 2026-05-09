/**
 * Vidyouth — runtime theme assembly.
 *
 * A `Theme` is composed at runtime from:
 *   - a base `BasePalette` (preset)
 *   - per-token colour `overrides` (user customisations)
 *   - `effects` knobs (glass alpha, shimmer intensity, glow, elevation)
 *
 * Components consume the *resolved* `Theme.colors` — alpha values are already
 * baked in. They never need to know about overrides or effects directly.
 */

import { Platform, ViewStyle } from 'react-native';
import { BasePalette, PaletteName, presets } from './presets';

export type { PaletteName } from './presets';
export { presets, presetMeta } from './presets';

// ──────────────────────────────────────────────────────────────────────────
// Effects
// ──────────────────────────────────────────────────────────────────────────

export interface Effects {
  /** Alpha used for `colors.glassBg`. 0 = invisible, 1 = opaque. */
  glassOpacity: number;
  /** Alpha used for `colors.glassBgStrong`. */
  glassStrongOpacity: number;
  /** Alpha used for `colors.glassBorder`. */
  borderOpacity: number;
  /** Master toggle for press shimmer. */
  shimmerEnabled: boolean;
  /** Peak opacity of the shimmer overlay during press. 0..1. */
  shimmerIntensity: number;
  /** Multiplier on glow shadow opacity. 0..1.5. */
  glowIntensity: number;
  /** Android elevation for cards (0..24). */
  cardElevation: number;
}

export const defaultEffects: Effects = {
  glassOpacity: 0.22,
  glassStrongOpacity: 0.30,
  borderOpacity: 0.22,
  shimmerEnabled: true,
  shimmerIntensity: 0.55,
  glowIntensity: 0.5,
  cardElevation: 10,
};

// ──────────────────────────────────────────────────────────────────────────
// Resolved palette consumed by components
// ──────────────────────────────────────────────────────────────────────────

export interface Palette {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGradientStart: string;
  bgGradientEnd: string;

  glassBg: string;
  glassBgStrong: string;
  glassBorder: string;
  glassBorderStrong: string;

  accentPrimary: string;
  accentSecondary: string;
  accentGradient: [string, string];

  success: string;
  warning: string;
  danger: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  shimmerPrimary: string;
  shimmerSecondary: string;

  glowPrimary: string;
  shadowColor: string;

  auraA: string;
  auraB: string;
  auraC: string;
}

export type ColorOverrides = Partial<BasePalette>;

// ──────────────────────────────────────────────────────────────────────────
// Static design tokens
// ──────────────────────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ──────────────────────────────────────────────────────────────────────────
// Resolved theme
// ──────────────────────────────────────────────────────────────────────────

export interface Shadow {
  soft: ViewStyle;
  card: ViewStyle;
  glow: ViewStyle;
}

export interface Theme {
  preset: PaletteName;
  colors: Palette;
  radius: typeof radius;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  shadow: Shadow;
  effects: Effects;
}

const clampAlpha = (n: number) => Math.max(0, Math.min(1, n));

const buildShadow = (base: BasePalette, fx: Effects): Shadow => {
  const glow = clampAlpha(fx.glowIntensity);
  return {
    soft: Platform.select<ViewStyle>({
      ios: {
        shadowColor: base.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: Math.round(fx.cardElevation * 0.4) },
      default: {},
    }) as ViewStyle,
    card: Platform.select<ViewStyle>({
      ios: {
        shadowColor: base.shadowColor,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.30,
        shadowRadius: 28,
      },
      android: { elevation: fx.cardElevation },
      default: {},
    }) as ViewStyle,
    glow: Platform.select<ViewStyle>({
      ios: {
        shadowColor: base.glowPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4 * glow + 0.05,
        shadowRadius: 18 + 12 * glow,
      },
      android: { elevation: Math.round(fx.cardElevation * 0.8) },
      default: {},
    }) as ViewStyle,
  };
};

const resolvePalette = (base: BasePalette, fx: Effects): Palette => {
  const glassA = clampAlpha(fx.glassOpacity);
  const glassStrongA = clampAlpha(fx.glassStrongOpacity);
  const borderA = clampAlpha(fx.borderOpacity);
  const borderStrongA = clampAlpha(fx.borderOpacity * 1.6);

  return {
    bgPrimary: base.bgPrimary,
    bgSecondary: base.bgSecondary,
    bgTertiary: base.bgTertiary,
    bgGradientStart: base.bgGradientStart,
    bgGradientEnd: base.bgGradientEnd,

    glassBg: `rgba(${base.glassRgb}, ${glassA})`,
    glassBgStrong: `rgba(${base.glassRgb}, ${glassStrongA})`,
    glassBorder: `rgba(${base.glassBorderRgb}, ${borderA})`,
    glassBorderStrong: `rgba(${base.glassBorderRgb}, ${borderStrongA})`,

    accentPrimary: base.accentPrimary,
    accentSecondary: base.accentSecondary,
    accentGradient: base.accentGradient,

    success: base.success,
    warning: base.warning,
    danger: base.danger,

    textPrimary: base.textPrimary,
    textSecondary: base.textSecondary,
    textMuted: base.textMuted,

    shimmerPrimary: base.shimmerPrimary,
    shimmerSecondary: base.shimmerSecondary,

    glowPrimary: base.glowPrimary,
    shadowColor: base.shadowColor,

    auraA: base.auraA,
    auraB: base.auraB,
    auraC: base.auraC,
  };
};

/** Compose a full theme from a preset + optional colour overrides + effects. */
export function buildTheme(
  preset: PaletteName = 'warm-amber',
  overrides: ColorOverrides = {},
  effects: Effects = defaultEffects,
): Theme {
  const base: BasePalette = { ...presets[preset], ...overrides };
  return {
    preset,
    colors: resolvePalette(base, effects),
    radius,
    spacing,
    fontSize,
    fontWeight,
    shadow: buildShadow(base, effects),
    effects,
  };
}

/** Default theme for components that aren't yet inside the provider. */
export const theme: Theme = buildTheme('warm-amber', {}, defaultEffects);
