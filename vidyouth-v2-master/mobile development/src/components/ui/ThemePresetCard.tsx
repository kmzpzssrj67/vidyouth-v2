import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { presets, presetMeta } from '@/theme/presets';
import { PaletteName } from '@/theme/theme';
import { useThemeTokens } from '@/theme/ThemeProvider';
import PressShimmer from './PressShimmer';

interface ThemePresetCardProps {
  preset: PaletteName;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A swatch card representing one preset. Shows mini gradient + accent dots
 * and a tick when selected. Uses the *target preset's* colours, not the
 * active theme — so the user can preview each option visually.
 */
export default function ThemePresetCard({
  preset,
  active,
  onPress,
  style,
}: ThemePresetCardProps) {
  const t = useThemeTokens();
  const base = presets[preset];
  const meta = presetMeta[preset];

  return (
    <PressShimmer
      onPress={onPress}
      radius={t.radius.xl}
      accessibilityRole="button"
      accessibilityLabel={`Select ${meta.label} preset`}
      style={style}
    >
      <View
        style={[
          styles.card,
          {
            borderRadius: t.radius.xl,
            borderColor: active ? t.colors.accentPrimary : t.colors.glassBorder,
            borderWidth: active ? 2 : StyleSheet.hairlineWidth * 2,
            backgroundColor: t.colors.glassBg,
          },
        ]}
      >
        {/* swatch */}
        <LinearGradient
          colors={[base.bgGradientStart, base.bgPrimary, base.bgGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.swatch, { borderRadius: t.radius.lg }]}
        >
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: base.accentPrimary }]} />
            <View style={[styles.dot, { backgroundColor: base.accentSecondary }]} />
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: `rgba(${base.glassBorderRgb}, 0.7)`,
                  borderWidth: 1,
                  borderColor: `rgba(${base.glassBorderRgb}, 0.4)`,
                },
              ]}
            />
          </View>
          {active ? (
            <View
              style={[
                styles.tick,
                { backgroundColor: t.colors.accentPrimary },
              ]}
            >
              <Check size={12} color={t.colors.bgPrimary} strokeWidth={3} />
            </View>
          ) : null}
        </LinearGradient>

        <Text
          style={[
            styles.title,
            { color: t.colors.textPrimary, fontSize: t.fontSize.md },
          ]}
          numberOfLines={1}
        >
          {meta.label}
        </Text>
        <Text
          style={[
            styles.desc,
            { color: t.colors.textMuted, fontSize: t.fontSize.xs },
          ]}
          numberOfLines={2}
        >
          {meta.description}
        </Text>
      </View>
    </PressShimmer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    minHeight: 158,
  },
  swatch: {
    height: 64,
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  dotRow: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  title: {
    marginTop: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  desc: {
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
});
