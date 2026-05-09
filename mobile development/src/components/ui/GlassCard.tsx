import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeTokens } from '@/theme/ThemeProvider';
import PressShimmer from './PressShimmer';

interface GlassCardProps {
  children: ReactNode;
  /** Stronger surface (raised cards / hero card). */
  strong?: boolean;
  /** Override radius (defaults to theme.radius.xxl). */
  radius?: number;
  /** Override padding (defaults to theme.spacing.xl). */
  padding?: number;
  style?: StyleProp<ViewStyle>;
  /** BlurView intensity 0-100. 0 disables blur (cheaper on low-end Android). */
  blurIntensity?: number;
  /** Make the whole card pressable with shimmer feedback. */
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Translucent frosted-glass surface. Layers:
 *   1. expo-blur BlurView   → backdrop blur
 *   2. tinted overlay        → glassBg colour from theme
 *   3. top-edge highlight    → soft white gradient
 *   4. children              → on top of everything
 *
 * If `onPress` is provided, the card becomes a PressShimmer Pressable.
 */
export default function GlassCard({
  children,
  strong = false,
  radius,
  padding,
  style,
  blurIntensity = 30,
  onPress,
  accessibilityLabel,
}: GlassCardProps) {
  const t = useThemeTokens();
  const r = radius ?? t.radius.xxl;
  const p = padding ?? t.spacing.xl;

  const tint = strong ? t.colors.glassBgStrong : t.colors.glassBg;
  const borderColor = strong
    ? t.colors.glassBorderStrong
    : t.colors.glassBorder;

  const body = (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: r,
          borderColor,
          backgroundColor: t.colors.bgSecondary,
        },
        t.shadow.card,
        style,
      ]}
    >
      {blurIntensity > 0 && Platform.OS !== 'web' ? (
        <BlurView
          tint="dark"
          intensity={blurIntensity}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        />
      ) : null}

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tint, borderRadius: r },
        ]}
      />

      <LinearGradient
        colors={[
          'rgba(255,255,255,0.10)',
          'rgba(255,255,255,0.02)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: r, opacity: strong ? 0.9 : 0.7 },
        ]}
        pointerEvents="none"
      />

      <View style={{ padding: p }}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <PressShimmer
        onPress={onPress}
        radius={r}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {body}
      </PressShimmer>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
