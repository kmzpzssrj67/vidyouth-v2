import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeTokens } from '@/theme/ThemeProvider';
import VidyouthLogoSvg from './VidyouthLogoSvg';

interface BrandMarkProps {
  style?: StyleProp<ViewStyle>;
  /** Compact mode — used inside dense headers. */
  compact?: boolean;
}

/** Vidyouth logo lockup: circular green badge + "Vidyouth" / "AI Learning Lab". */
export default function BrandMark({ style, compact = false }: BrandMarkProps) {
  const t = useThemeTokens();
  const size = compact ? 36 : 56;
  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.glyphRing,
          {
            width: size + 6,
            height: size + 6,
            borderRadius: (size + 6) / 2,
            shadowColor: t.colors.glowPrimary,
            shadowOpacity: 0.45 * t.effects.glowIntensity,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          },
        ]}
      >
        <VidyouthLogoSvg size={size} accent="#22C55E" background="#FFFFFF" />
      </View>

      <View>
        <Text
          style={[
            styles.wordmark,
            {
              color: t.colors.textPrimary,
              fontSize: compact ? t.fontSize.lg : t.fontSize.xl,
            },
          ]}
        >
          Vidyouth
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: t.colors.textMuted, fontSize: t.fontSize.xs },
          ]}
        >
          AI LEARNING LAB
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyphRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  wordmark: { fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontWeight: '600', letterSpacing: 2.2, marginTop: 2 },
});
