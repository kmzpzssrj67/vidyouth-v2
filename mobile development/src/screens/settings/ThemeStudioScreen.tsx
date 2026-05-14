import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { ChevronLeft, RotateCcw, Save, Palette as PaletteIcon } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { PaletteName } from '@/theme/theme';
import { presets } from '@/theme/presets';
import ScreenBackground from '@/components/ui/ScreenBackground';
import GlassCard from '@/components/ui/GlassCard';
import ThemePresetCard from '@/components/ui/ThemePresetCard';
import ThemePreviewCard from '@/components/ui/ThemePreviewCard';
import ThemedSlider from '@/components/ui/ThemedSlider';
import ColorSwatchRow from '@/components/ui/ColorSwatchRow';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';

interface ThemeStudioScreenProps {
  onBack?: () => void;
}

const PRESET_LIST: PaletteName[] = [
  'warm-amber',
  'cyber-navy',
  'warm-beige',
  'calm-green',
  'purple',
  'apple-light',
  'apple-dark',
  'swiss-white',
  'rose-blush',
  'ocean-deep',
  'sunset-orange',
  'monokai-pro',
  'graphite',
  'high-contrast',
];

/** Curated swatch options per token role. Kept tight on purpose — full
 *  hex picking would need a heavier modal we don't ship yet. */
const SWATCHES = {
  bgPrimary: ['#150A04', '#040A18', '#1F160E', '#08140C', '#0F0820', '#000000', '#F5F5F7', '#FFFFFF'],
  accent: [
    '#E8C28C', '#F5C679', '#7CC4FF', '#9EDDB5', '#C4A8FF',
    '#0A84FF', '#FF9F0A', '#FF453A', '#34C759', '#111111',
  ],
  text: ['#FAF0E0', '#F0F6FF', '#F5ECDD', '#EEF7F0', '#F4EEFF', '#FFFFFF', '#1D1D1F', '#0A0A0A'],
  textSecondary: ['#D9C4A6', '#B8CDEC', '#D8C6A8', '#B8D6C2', '#C8BBE5', '#E0E0E5', '#3A3A3C', '#3A3A3A'],
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function ThemeStudioScreen({ onBack }: ThemeStudioScreenProps) {
  const {
    theme,
    preset,
    overrides,
    effects,
    setPreset,
    updateOverrides,
    updateEffects,
    saveCurrent,
    resetTheme,
  } = useTheme();

  // resolved colour values that should appear "selected" in the swatch rows.
  // Falls back to preset values when the user hasn't customised that slot.
  const current = useMemo(() => {
    const base = presets[preset];
    return {
      bgPrimary: overrides.bgPrimary ?? base.bgPrimary,
      bgSecondary: overrides.bgSecondary ?? base.bgSecondary,
      accentPrimary: overrides.accentPrimary ?? base.accentPrimary,
      accentSecondary: overrides.accentSecondary ?? base.accentSecondary,
      success: overrides.success ?? base.success,
      warning: overrides.warning ?? base.warning,
      textPrimary: overrides.textPrimary ?? base.textPrimary,
      textSecondary: overrides.textSecondary ?? base.textSecondary,
    };
  }, [preset, overrides]);

  const onReset = () => {
    Alert.alert(
      'Reset theme?',
      'This will revert to Warm Amber and clear all customisations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetTheme();
          },
        },
      ],
    );
  };

  const onSave = async () => {
    await saveCurrent();
    if (typeof window !== 'undefined' && (window as any).alert) {
      (window as any).alert('Theme saved');
    } else {
      Alert.alert('Saved', 'Your theme is stored on this device.');
    }
  };

  return (
    <ScreenBackground>
      {/* header */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[
              styles.backBtn,
              {
                borderColor: theme.colors.glassBorder,
                backgroundColor: theme.colors.glassBg,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <ChevronLeft size={20} color={theme.colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, marginLeft: onBack ? 12 : 0 }}>
          <Text
            style={[
              styles.eyebrow,
              { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
            ]}
          >
            <PaletteIcon size={12} color={theme.colors.textMuted} />  THEME STUDIO
          </Text>
          <Text
            style={[
              styles.title,
              { color: theme.colors.textPrimary, fontSize: theme.fontSize.xxl },
            ]}
          >
            Customise Vidyouth
          </Text>
          <Text
            style={[
              styles.lede,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
            ]}
          >
            Pick a preset, fine-tune colours, dial in glass + glow.
            Changes apply across every screen instantly.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* preset grid */}
        <Text style={[styles.section, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg }]}>
          Presets
        </Text>
        <View style={styles.grid}>
          {PRESET_LIST.map((p) => (
            <View key={p} style={styles.gridItem}>
              <ThemePresetCard
                preset={p}
                active={p === preset}
                onPress={() => setPreset(p)}
              />
            </View>
          ))}
        </View>

        {/* live preview */}
        <Text
          style={[
            styles.section,
            { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, marginTop: 28 },
          ]}
        >
          Live preview
        </Text>
        <ThemePreviewCard />

        {/* colours */}
        <Text
          style={[
            styles.section,
            { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, marginTop: 28 },
          ]}
        >
          Custom colours
        </Text>
        <GlassCard padding={theme.spacing.lg}>
          <ColorSwatchRow
            label="Background primary"
            value={current.bgPrimary}
            options={SWATCHES.bgPrimary}
            onChange={(c) => updateOverrides({ bgPrimary: c })}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Background secondary"
            value={current.bgSecondary}
            options={SWATCHES.bgPrimary}
            onChange={(c) => updateOverrides({ bgSecondary: c })}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Accent primary"
            value={current.accentPrimary}
            options={SWATCHES.accent}
            onChange={(c) =>
              updateOverrides({
                accentPrimary: c,
                accentGradient: [c, current.accentSecondary],
              })
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Accent secondary"
            value={current.accentSecondary}
            options={SWATCHES.accent}
            onChange={(c) =>
              updateOverrides({
                accentSecondary: c,
                accentGradient: [current.accentPrimary, c],
              })
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Success"
            value={current.success}
            options={SWATCHES.accent}
            onChange={(c) => updateOverrides({ success: c })}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Warning"
            value={current.warning}
            options={SWATCHES.accent}
            onChange={(c) => updateOverrides({ warning: c })}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Text primary"
            value={current.textPrimary}
            options={SWATCHES.text}
            onChange={(c) => updateOverrides({ textPrimary: c })}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
          <ColorSwatchRow
            label="Text secondary"
            value={current.textSecondary}
            options={SWATCHES.textSecondary}
            onChange={(c) => updateOverrides({ textSecondary: c })}
          />
        </GlassCard>

        {/* effects */}
        <Text
          style={[
            styles.section,
            { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, marginTop: 28 },
          ]}
        >
          Appearance
        </Text>
        <GlassCard padding={theme.spacing.lg}>
          <ThemedSlider
            label="Glass opacity"
            valueLabel={pct(effects.glassOpacity)}
            value={effects.glassOpacity}
            min={0.05}
            max={0.6}
            onValueChange={(v) => updateEffects({ glassOpacity: v })}
          />
          <ThemedSlider
            label="Strong-glass opacity"
            valueLabel={pct(effects.glassStrongOpacity)}
            value={effects.glassStrongOpacity}
            min={0.1}
            max={0.8}
            onValueChange={(v) => updateEffects({ glassStrongOpacity: v })}
          />
          <ThemedSlider
            label="Border opacity"
            valueLabel={pct(effects.borderOpacity)}
            value={effects.borderOpacity}
            min={0.05}
            max={0.7}
            onValueChange={(v) => updateEffects({ borderOpacity: v })}
          />
          <ThemedSlider
            label="Press shimmer intensity"
            valueLabel={pct(effects.shimmerIntensity)}
            value={effects.shimmerIntensity}
            min={0}
            max={1}
            onValueChange={(v) =>
              updateEffects({
                shimmerIntensity: v,
                shimmerEnabled: v > 0.02,
              })
            }
          />
          <ThemedSlider
            label="Glow intensity"
            valueLabel={pct(effects.glowIntensity)}
            value={effects.glowIntensity}
            min={0}
            max={1.2}
            onValueChange={(v) => updateEffects({ glowIntensity: v })}
          />
          <ThemedSlider
            label="Card elevation"
            valueLabel={String(Math.round(effects.cardElevation))}
            value={effects.cardElevation}
            min={0}
            max={24}
            step={1}
            onValueChange={(v) => updateEffects({ cardElevation: v })}
          />
        </GlassCard>

        {/* actions */}
        <View style={styles.actions}>
          <SecondaryButton
            label="Reset to default"
            icon={RotateCcw}
            onPress={onReset}
            style={{ flex: 1 }}
            block
          />
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Save theme" onPress={onSave} icon={Save} />
          </View>
        </View>
        <Text
          style={[
            styles.foot,
            { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
          ]}
        >
          Themes are saved on this device. Sign in on another device to sync once cloud-sync ships.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginTop: 6,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { fontWeight: '700', letterSpacing: -0.5 },
  lede: { fontWeight: '500', marginTop: 4, lineHeight: 20 },
  scroll: { padding: 20, paddingTop: 16, paddingBottom: 40 },
  section: { fontWeight: '700', letterSpacing: -0.3, marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  foot: {
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});
